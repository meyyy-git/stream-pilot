import { useColorScheme } from 'react-native';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Colors } from '@/constants/theme';
import type { PanelStatus } from '@/components/console-section';
import { AppSettings, PanelId, defaultSettings } from '@/lib/domain';
import { loadSettings, saveSettings } from '@/lib/storage';
import { currentVersion, fetchLatestUpdate, UpdateState } from '@/lib/updates';

type AppContextValue = {
  loaded: boolean;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  panelStatuses: Record<PanelId, PanelStatus>;
  setPanelStatus: (panel: PanelId, status: PanelStatus) => void;
  update: UpdateState;
  checkForUpdates: () => Promise<void>;
  resolvedTheme: 'light' | 'dark';
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [panelStatuses, setPanelStatuses] = useState<Record<PanelId, PanelStatus>>({
    chat: 'unconfigured',
    obs: 'unconfigured',
    trakteer: 'unconfigured',
  });
  const [update, setUpdate] = useState<UpdateState>({ status: 'checking', currentVersion });

  const checkForUpdates = useCallback(async () => {
    setUpdate({ status: 'checking', currentVersion });
    try {
      setUpdate(await fetchLatestUpdate());
    } catch {
      setUpdate({ status: 'error', currentVersion });
    }
  }, []);

  const setPanelStatus = useCallback((panel: PanelId, status: PanelStatus) => {
    setPanelStatuses((current) => current[panel] === status ? current : { ...current, [panel]: status });
  }, []);

  useEffect(() => {
    loadSettings().then((value) => {
      setSettings(value);
      setLoaded(true);
      void checkForUpdates();
    });
  }, [checkForUpdates]);

  useEffect(() => {
    if (!loaded) return;
    const timeout = setTimeout(() => void saveSettings(settings), 120);
    return () => clearTimeout(timeout);
  }, [loaded, settings]);

  const resolvedTheme = settings.theme === 'system'
    ? systemTheme === 'dark' ? 'dark' : 'light'
    : settings.theme;

  const value = useMemo<AppContextValue>(() => ({
    loaded,
    settings,
    setSettings,
    panelStatuses,
    setPanelStatus,
    update,
    checkForUpdates,
    resolvedTheme,
    colors: Colors[resolvedTheme],
  }), [checkForUpdates, loaded, panelStatuses, resolvedTheme, setPanelStatus, settings, update]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
