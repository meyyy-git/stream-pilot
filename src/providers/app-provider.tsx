import { useColorScheme } from 'react-native';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { Colors } from '@/constants/theme';
import { AppSettings, defaultSettings } from '@/lib/domain';
import { loadSettings, saveSettings } from '@/lib/storage';

type AppContextValue = {
  loaded: boolean;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  resolvedTheme: 'light' | 'dark';
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    loadSettings().then((value) => {
      setSettings(value);
      setLoaded(true);
    });
  }, []);

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
    resolvedTheme,
    colors: Colors[resolvedTheme],
  }), [loaded, resolvedTheme, settings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
