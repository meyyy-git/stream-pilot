/*
THESIS: Live production reads as a vision-mixer surface, never three generic app cards.
OWN-WORLD: Cool neutral powder-coated panels, engraved-feeling system labels, low-profile key banks, and semantic tally colors only.
STORY: Monitor chat, verify OBS state, trigger Trakteer, then reshape the console without leaving it.
FIRST VIEWPORT: A narrow app bar frames a dominant chat monitor and two control banks at 50/25/25; Settings and Edit Layout stay secondary.
FORM: Vision Mixer, Impeccable direction seed 68075987.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
*/
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from '@/providers/app-provider';

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { loaded, resolvedTheme, colors } = useApp();

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  const navigationTheme = useMemo(() => {
    const base = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.text,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, resolvedTheme]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Pengaturan', headerBackTitle: 'Konsol' }} />
        <Stack.Screen name="obs-qr-scanner" options={{ title: 'Pindai QR OBS', presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
