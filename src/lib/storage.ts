import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { AppSettings, chatFontSizes, defaultSettings, defaultTrakteerConfig, TrakteerConfig } from '@/lib/domain';

const SETTINGS_KEY = 'stream-pilot.settings.v1';
const OBS_PASSWORD_KEY = 'stream-pilot.obs-password';
const TRAKTEER_KEY = 'stream-pilot.trakteer';
const actionKey = (id: string) => `stream-pilot.action.${id}`;

type StoredSettings = Pick<AppSettings, 'streamLink' | 'chatFontSize' | 'theme' | 'keepAwake'> & {
  obs: Omit<AppSettings['obs'], 'password'>;
};

type LegacySettings = StoredSettings & { groups?: { actions?: { id: string }[] }[] };

function parseTrakteerConfig(raw: string | null): TrakteerConfig {
  if (!raw) return { ...defaultTrakteerConfig };
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(defaultTrakteerConfig).map((key) => [key, typeof value[key] === 'string' ? value[key] : '']),
    ) as TrakteerConfig;
  } catch {
    return { ...defaultTrakteerConfig };
  }
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;

  try {
    const stored = JSON.parse(raw) as LegacySettings;
    const [password, trakteer] = await Promise.all([
      SecureStore.getItemAsync(OBS_PASSWORD_KEY),
      SecureStore.getItemAsync(TRAKTEER_KEY).then(parseTrakteerConfig),
      ...(stored.groups ?? []).flatMap((group) =>
        (group.actions ?? []).map((action) => SecureStore.deleteItemAsync(actionKey(action.id)).catch(() => undefined)),
      ),
    ]);

    return {
      streamLink: stored.streamLink ?? defaultSettings.streamLink,
      obs: { ...defaultSettings.obs, ...stored.obs, password: password ?? '' },
      trakteer,
      chatFontSize: chatFontSizes.includes(stored.chatFontSize)
        ? stored.chatFontSize
        : defaultSettings.chatFontSize,
      theme: stored.theme ?? defaultSettings.theme,
      keepAwake: stored.keepAwake ?? defaultSettings.keepAwake,
    };
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings) {
  const stored: StoredSettings = {
    streamLink: settings.streamLink,
    obs: { host: settings.obs.host, port: settings.obs.port, secure: settings.obs.secure },
    chatFontSize: settings.chatFontSize,
    theme: settings.theme,
    keepAwake: settings.keepAwake,
  };

  await Promise.all([
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(stored)),
    settings.obs.password
      ? SecureStore.setItemAsync(OBS_PASSWORD_KEY, settings.obs.password)
      : SecureStore.deleteItemAsync(OBS_PASSWORD_KEY),
    Object.values(settings.trakteer).some(Boolean)
      ? SecureStore.setItemAsync(TRAKTEER_KEY, JSON.stringify(settings.trakteer))
      : SecureStore.deleteItemAsync(TRAKTEER_KEY),
  ]);
}
