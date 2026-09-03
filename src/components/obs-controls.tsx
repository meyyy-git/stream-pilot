import * as Haptics from 'expo-haptics';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ControlButton, StatusLabel } from '@/components/control-ui';
import { ThemedText } from '@/components/themed-text';
import { useObs } from '@/hooks/use-obs';
import { ObsConfig } from '@/lib/domain';

const statusCopy = {
  unconfigured: ['Belum disetel', 'neutral'],
  connecting: ['Menghubungkan', 'warning'],
  connected: ['Terhubung', 'success'],
  reconnecting: ['Menyambung ulang', 'warning'],
  error: ['Terputus', 'danger'],
} as const;

export function ObsControls({ config }: { config: ObsConfig }) {
  const obs = useObs(config);
  const [label, tone] = statusCopy[obs.status];
  const disabled = obs.status !== 'connected';

  return (
    <View style={styles.container}>
      <View style={styles.statusLine}>
        <StatusLabel live tone={tone}>{label}</StatusLabel>
        {obs.error ? <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.error}>{obs.error}</ThemedText> : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} nestedScrollEnabled>
        <ThemedText type="smallBold" themeColor="textSecondary">SCENE PROGRAM</ThemedText>
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
          {!obs.scenes.length ? <ThemedText type="small" themeColor="textSecondary">Belum ada scene.</ThemedText> : null}
        </View>

        <ThemedText type="smallBold" themeColor="textSecondary">SOURCE · {obs.activeScene || '—'}</ThemedText>
        <View>
          {obs.items.map((item) => (
            <View key={item.key} style={[styles.sourceRow, { paddingLeft: 4 + item.depth * 18 }]}>
              <View style={styles.sourceCopy}>
                <ThemedText type="smallBold" numberOfLines={1}>{item.name}</ThemedText>
                {item.isGroup ? <ThemedText type="small" themeColor="textSecondary">Group</ThemedText> : null}
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
          {!obs.items.length ? <ThemedText type="small" themeColor="textSecondary">Source scene aktif akan muncul di sini.</ThemedText> : null}
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
