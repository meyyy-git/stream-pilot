import * as KeepAwake from 'expo-keep-awake';
import { router } from 'expo-router';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConsoleSection, PanelStatus } from '@/components/console-section';
import { IconButton, StatusLabel } from '@/components/control-ui';
import { FontSizeDropdown } from '@/components/font-size-dropdown';
import { LiveChat } from '@/components/live-chat';
import { ObsControls } from '@/components/obs-controls';
import { ThemedText } from '@/components/themed-text';
import { TrakteerControls } from '@/components/trakteer-controls';
import { useTheme } from '@/hooks/use-theme';
import { PanelId } from '@/lib/domain';
import { useApp } from '@/providers/app-provider';

type IconName = SymbolViewProps['name'];

const tabs: { id: PanelId; label: string; icon: IconName }[] = [
  { id: 'chat', label: 'Chat', icon: { ios: 'bubble.left.and.bubble.right', android: 'chat' } },
  { id: 'obs', label: 'OBS', icon: { ios: 'rectangle.3.group', android: 'dashboard' } },
  { id: 'trakteer', label: 'Trakteer', icon: { ios: 'slider.horizontal.3', android: 'tune' } },
];

export default function LiveConsoleScreen() {
  const { width, height } = useWindowDimensions();
  const tablet = Math.min(width, height) >= 600;
  const theme = useTheme();
  const { settings, setSettings, update } = useApp();
  const [activePanel, setActivePanel] = useState<PanelId>('chat');
  const [chatStatus, setChatStatus] = useState<PanelStatus>('unconfigured');
  const [obsStatus, setObsStatus] = useState<PanelStatus>('unconfigured');
  const [trakteerStatus, setTrakteerStatus] = useState<PanelStatus>('unconfigured');

  useEffect(() => {
    if (settings.keepAwake) void KeepAwake.activateKeepAwakeAsync('live-console');
    else void KeepAwake.deactivateKeepAwake('live-console');
    return () => void KeepAwake.deactivateKeepAwake('live-console');
  }, [settings.keepAwake]);

  const panelProps = (id: PanelId) => ({
    pointerEvents: tablet || activePanel === id ? 'auto' as const : 'none' as const,
    accessibilityElementsHidden: !tablet && activePanel !== id,
    importantForAccessibility: !tablet && activePanel !== id ? 'no-hide-descendants' as const : 'auto' as const,
  });

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.appBar, { borderBottomColor: theme.border }]}>
          <View style={styles.brand}>
            <ThemedText type="smallBold">Stream Pilot</ThemedText>
            <StatusLabel>Kontrol Live Streaming</StatusLabel>
          </View>
          <View style={styles.settingsAction}>
            <IconButton
              accessibilityLabel={update.status === 'available' ? 'Buka Pengaturan, pembaruan tersedia' : 'Buka Pengaturan'}
              icon={{ ios: 'gearshape', android: 'settings' }}
              onPress={() => router.push('/settings')}
            />
            {update.status === 'available' ? (
              <View
                pointerEvents="none"
                style={[styles.updateBadge, { backgroundColor: theme.warning, borderColor: theme.background }]}
              />
            ) : null}
          </View>
        </View>

        <View style={[styles.console, tablet && styles.tabletConsole]}>
          <View {...panelProps('chat')} style={[styles.panel, tablet ? styles.chatPanel : activePanel !== 'chat' && styles.hiddenPanel]}>
            <ConsoleSection
              title="Live chat · YouTube"
              status={chatStatus}
              action={
                <FontSizeDropdown
                  value={settings.chatFontSize}
                  onChange={(chatFontSize) => setSettings((current) => ({ ...current, chatFontSize }))}
                  compact
                />
              }>
              <LiveChat streamLink={settings.streamLink} onStatusChange={setChatStatus} />
            </ConsoleSection>
          </View>
          <View {...panelProps('obs')} style={[styles.panel, tablet ? styles.controlPanel : activePanel !== 'obs' && styles.hiddenPanel]}>
            <ConsoleSection title="OBS" status={obsStatus}>
              <ObsControls config={settings.obs} onStatusChange={setObsStatus} />
            </ConsoleSection>
          </View>
          <View {...panelProps('trakteer')} style={[styles.panel, tablet ? styles.controlPanel : activePanel !== 'trakteer' && styles.hiddenPanel]}>
            <ConsoleSection title="Trakteer" status={trakteerStatus}>
              <TrakteerControls config={settings.trakteer} onStatusChange={setTrakteerStatus} />
            </ConsoleSection>
          </View>
        </View>

        {!tablet ? (
          <View style={[styles.bottomNav, { borderTopColor: theme.border }]} accessibilityRole="tablist">
            {tabs.map((tab) => {
              const active = activePanel === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  accessibilityRole="tab"
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected: active }}
                  onPress={() => setActivePanel(tab.id)}
                  style={({ pressed }) => [styles.tab, active && { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
                  <SymbolView name={tab.icon} size={22} tintColor={active ? theme.text : theme.textSecondary} />
                  <ThemedText type="smallBold" style={{ color: active ? theme.text : theme.textSecondary }}>{tab.label}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  appBar: {
    minHeight: 66,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brand: { flex: 1, minWidth: 0, gap: 1 },
  settingsAction: { position: 'relative' },
  updateBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  console: { flex: 1, minHeight: 0, minWidth: 0, gap: 10, padding: 10 },
  tabletConsole: { flexDirection: 'row' },
  panel: { flex: 1, minHeight: 0, minWidth: 0 },
  chatPanel: { flex: 4 },
  controlPanel: { flex: 3 },
  hiddenPanel: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  bottomNav: {
    minHeight: 66,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    minHeight: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pressed: { opacity: 0.68 },
});
