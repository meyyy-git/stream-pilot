import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { PanelStatus } from '@/components/console-section';
import { ControlButton, PanelEmptyState, StatusLabel } from '@/components/control-ui';
import { ThemedText } from '@/components/themed-text';
import { useObs } from '@/hooks/use-obs';
import { ObsConfig } from '@/lib/domain';

const statusCopy = {
  unconfigured: ['Belum disetel', 'neutral'],
  connecting: ['Menghubungkan ke OBS…', 'warning'],
  connected: ['Terhubung', 'success'],
  reconnecting: ['Menyambungkan ulang…', 'warning'],
  error: ['Koneksi OBS terputus', 'danger'],
} as const;

export function ObsControls({
  config,
  onStatusChange,
}: {
  config: ObsConfig;
  onStatusChange?: (status: PanelStatus) => void;
}) {
  const obs = useObs(config);
  const [label, tone] = statusCopy[obs.status];
  const disabled = obs.status !== 'connected';
  const panelStatus: PanelStatus = obs.status === 'connected'
    ? 'ready'
    : obs.status === 'error'
      ? 'error'
      : obs.status === 'unconfigured'
        ? 'unconfigured'
        : 'connecting';

  useEffect(() => {
    onStatusChange?.(panelStatus);
  }, [onStatusChange, panelStatus]);

  if (obs.status === 'unconfigured') {
    return (
      <PanelEmptyState
        icon={{ ios: 'qrcode.viewfinder', android: 'qr_code_scanner' }}
        title="Hubungkan OBS"
        description="Pindai QR dari OBS atau isi detail koneksi secara manual."
        actionLabel="Atur OBS"
        onAction={() => router.push('/settings')}
      />
    );
  }

  if (!obs.scenes.length && (obs.status === 'connecting' || obs.status === 'reconnecting')) {
    return (
      <PanelEmptyState
        icon={{ ios: 'rectangle.3.group', android: 'dashboard' }}
        title={label}
        description="Pastikan perangkat ini dan komputer OBS berada di jaringan yang sama."
        actionLabel="Periksa Pengaturan"
        onAction={() => router.push('/settings')}
      />
    );
  }

  if (!obs.scenes.length && obs.status === 'error') {
    return (
      <PanelEmptyState
        icon={{ ios: 'exclamationmark.triangle', android: 'warning' }}
        title="OBS belum dapat dihubungkan"
        description="Periksa jaringan dan detail koneksi, lalu uji kembali dari Pengaturan."
        actionLabel="Periksa Pengaturan"
        onAction={() => router.push('/settings')}
        tone="danger"
      />
    );
  }

  return (
    <View style={styles.container}>
      {obs.status === 'reconnecting' || obs.status === 'error' ? (
        <View style={styles.statusLine}>
          <StatusLabel live tone={tone}>{label}</StatusLabel>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.error}>
            Periksa jaringan atau detail koneksi di Pengaturan.
          </ThemedText>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} nestedScrollEnabled>
        <ThemedText type="smallBold" themeColor="textSecondary">Scene program</ThemedText>
        <View style={styles.buttonGrid}>
          {obs.scenes.map((scene) => (
            <ControlButton
              key={scene.uuid ?? scene.name}
              label={scene.name}
              active={scene.name === obs.activeScene}
              disabled={disabled}
              tone="green"
              onPress={() => {
                void obs.switchScene(scene.name)
                  .then(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
                  .catch(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
              }}
            />
          ))}
          {!obs.scenes.length ? <ThemedText type="small" themeColor="textSecondary">Belum ada scene di OBS.</ThemedText> : null}
        </View>

        <ThemedText type="smallBold" themeColor="textSecondary">Source · {obs.activeScene || 'Belum ada scene aktif'}</ThemedText>
        <View>
          {obs.items.map((item) => (
            <View key={item.key} style={[styles.sourceRow, { paddingLeft: 4 + item.depth * 18 }]}>
              <View style={styles.sourceCopy}>
                <ThemedText type="smallBold" numberOfLines={1}>{item.name}</ThemedText>
                {item.isGroup ? <ThemedText type="small" themeColor="textSecondary">Grup</ThemedText> : null}
              </View>
              <Switch
                accessibilityLabel={`${item.enabled ? 'Sembunyikan' : 'Tampilkan'} ${item.name}`}
                value={item.enabled}
                disabled={disabled}
                onValueChange={(enabled) => {
                  void obs.setItemEnabled(item, enabled)
                    .then(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
                    .catch(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
                }}
              />
            </View>
          ))}
          {!obs.items.length ? <ThemedText type="small" themeColor="textSecondary">Source dari scene aktif akan muncul di sini.</ThemedText> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  statusLine: { minHeight: 38, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { flex: 1 },
  scrollContent: { padding: 14, paddingTop: 6, gap: 12 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceCopy: { flex: 1, minWidth: 0 },
});
