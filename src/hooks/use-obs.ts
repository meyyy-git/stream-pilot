import { AppState } from 'react-native';
import { EventSubscription, OBSWebSocket as ObsWebSocketClient } from 'obs-websocket-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ObsConfig } from '@/lib/domain';

export type ObsStatus = 'unconfigured' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export type ObsScene = {
  name: string;
  uuid?: string;
};

export type ObsSceneItem = {
  key: string;
  id: number;
  name: string;
  enabled: boolean;
  isGroup: boolean;
  sceneName: string;
  depth: number;
};

type RawSceneItem = {
  sceneItemId: number;
  sourceName: string;
  sceneItemEnabled: boolean;
  isGroup?: boolean;
};

const connectionUrl = ({ host, port, secure }: ObsConfig) => `${secure ? 'wss' : 'ws'}://${host.trim()}:${port.trim() || '4455'}`;

export async function testObsConnection(config: ObsConfig) {
  if (!config.host.trim()) throw new Error('Host OBS belum diisi.');
  const client = new ObsWebSocketClient();
  try {
    const result = await client.connect(connectionUrl(config), config.password || undefined, { rpcVersion: 1 });
    return result.obsWebSocketVersion;
  } finally {
    await client.disconnect().catch(() => undefined);
  }
}

export function useObs(config: ObsConfig) {
  const clientRef = useRef<ObsWebSocketClient | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<ObsStatus>(config.host ? 'connecting' : 'unconfigured');
  const [error, setError] = useState('');
  const [scenes, setScenes] = useState<ObsScene[]>([]);
  const [activeScene, setActiveScene] = useState('');
  const [items, setItems] = useState<ObsSceneItem[]>([]);

  const loadItems = useCallback(async (client: ObsWebSocketClient, sceneName: string) => {
    async function read(containerName: string, depth: number, isGroup: boolean): Promise<ObsSceneItem[]> {
      const response = isGroup
        ? await client.call('GetGroupSceneItemList', { sceneName: containerName })
        : await client.call('GetSceneItemList', { sceneName: containerName });
      const raw = response.sceneItems as unknown as RawSceneItem[];
      const rows: ObsSceneItem[] = [];

      for (const item of raw) {
        rows.push({
          key: `${containerName}:${item.sceneItemId}`,
          id: item.sceneItemId,
          name: item.sourceName,
          enabled: item.sceneItemEnabled,
          isGroup: Boolean(item.isGroup),
          sceneName: containerName,
          depth,
        });
        if (item.isGroup) rows.push(...await read(item.sourceName, depth + 1, true));
      }
      return rows;
    }

    const next = await read(sceneName, 0, false);
    if (mountedRef.current) setItems(next);
  }, []);

  const loadScenes = useCallback(async (client: ObsWebSocketClient) => {
    const response = await client.call('GetSceneList');
    const nextScenes = (response.scenes as { sceneName: string; sceneUuid?: string }[]).map(
      (scene) => ({ name: scene.sceneName, uuid: scene.sceneUuid }),
    );
    if (!mountedRef.current) return;
    setScenes(nextScenes);
    setActiveScene(response.currentProgramSceneName);
    await loadItems(client, response.currentProgramSceneName);
  }, [loadItems]);

  useEffect(() => {
    mountedRef.current = true;
    let attempts = 0;
    let stopped = false;

    const clearReconnect = () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    };

    const disconnect = async () => {
      clearReconnect();
      const client = clientRef.current;
      clientRef.current = null;
      if (client) await client.disconnect().catch(() => undefined);
    };

    const scheduleReconnect = () => {
      if (stopped || AppState.currentState !== 'active' || !config.host.trim()) return;
      attempts += 1;
      setStatus('reconnecting');
      reconnectRef.current = setTimeout(connect, Math.min(1000 * 2 ** (attempts - 1), 15000));
    };

    const connect = async () => {
      clearReconnect();
      if (stopped || AppState.currentState !== 'active' || !config.host.trim()) {
        setStatus(config.host.trim() ? 'reconnecting' : 'unconfigured');
        return;
      }

      setStatus(attempts ? 'reconnecting' : 'connecting');
      setError('');
      const client = new ObsWebSocketClient();
      clientRef.current = client;

      client.on('ConnectionClosed', () => {
        if (!stopped) scheduleReconnect();
      });
      client.on('CurrentProgramSceneChanged', ({ sceneName }) => {
        setActiveScene(sceneName);
        void loadItems(client, sceneName);
      });
      client.on('SceneListChanged', () => void loadScenes(client));
      client.on('SceneItemEnableStateChanged', () => {
        setActiveScene((sceneName) => {
          if (sceneName) void loadItems(client, sceneName);
          return sceneName;
        });
      });
      client.on('SceneItemCreated', () => void loadScenes(client));
      client.on('SceneItemRemoved', () => void loadScenes(client));
      client.on('SceneItemListReindexed', () => void loadScenes(client));

      try {
        await client.connect(connectionUrl(config), config.password || undefined, {
          rpcVersion: 1,
          eventSubscriptions: EventSubscription.Scenes | EventSubscription.SceneItems,
        });
        if (stopped) return void client.disconnect();
        attempts = 0;
        setStatus('connected');
        await loadScenes(client);
      } catch (reason) {
        if (clientRef.current === client) clientRef.current = null;
        setError(reason instanceof Error ? reason.message : 'Koneksi OBS gagal.');
        setStatus('error');
        scheduleReconnect();
      }
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void connect();
      else void disconnect();
    });

    void connect();
    return () => {
      stopped = true;
      mountedRef.current = false;
      subscription.remove();
      void disconnect();
    };
  }, [config, config.host, config.password, config.port, loadItems, loadScenes]);

  const switchScene = useCallback(async (sceneName: string) => {
    const client = clientRef.current;
    if (!client) throw new Error('OBS belum terhubung.');
    await client.call('SetCurrentProgramScene', { sceneName });
  }, []);

  const setItemEnabled = useCallback(async (item: ObsSceneItem, enabled: boolean) => {
    const client = clientRef.current;
    if (!client) throw new Error('OBS belum terhubung.');
    await client.call('SetSceneItemEnabled', {
      sceneName: item.sceneName,
      sceneItemId: item.id,
      sceneItemEnabled: enabled,
    });
    setItems((current) => current.map((row) => row.key === item.key ? { ...row, enabled } : row));
  }, []);

  return { status, error, scenes, activeScene, items, switchScene, setItemEnabled };
}
