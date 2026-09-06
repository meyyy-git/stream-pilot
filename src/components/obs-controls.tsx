import * as Haptics from 'expo-haptics';
import { Slider } from '@expo/ui/community/slider';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { PanelStatus } from '@/components/console-section';
import { ControlButton, IconButton, PanelEmptyState, StatusLabel } from '@/components/control-ui';
import { SortableRow } from '@/components/sortable-row';
import { ThemedText } from '@/components/themed-text';
import { ObsAudioInput, useObs } from '@/hooks/use-obs';
import { useTheme } from '@/hooks/use-theme';
import { ObsConfig } from '@/lib/domain';
import { moveItem, orderItems } from '@/lib/list-order';
import { formatObsDb, obsDbToFader, obsFaderToDb } from '@/lib/obs-audio';
import { useApp } from '@/providers/app-provider';

const statusCopy = {
  unconfigured: ['Belum disetel', 'neutral'],
  connecting: ['Menghubungkan ke OBS…', 'warning'],
  connected: ['Terhubung', 'success'],
  reconnecting: ['Menyambungkan ulang…', 'warning'],
  error: ['Koneksi OBS terputus', 'danger'],
} as const;

function ObsSection({ title, open, onToggle, children }: PropsWithChildren & {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${open ? 'terbuka' : 'tertutup'}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>{title}</ThemedText>
        <SymbolView
          name={{ ios: open ? 'chevron.up' : 'chevron.down', android: open ? 'expand_less' : 'expand_more' }}
          size={18}
          tintColor={theme.textSecondary}
        />
      </Pressable>
      {open ? children : null}
    </View>
  );
}

function AudioMixerRow({
  input,
  disabled,
  onVolumeChange,
  onMuteChange,
}: {
  input: ObsAudioInput;
  disabled: boolean;
  onVolumeChange: (input: ObsAudioInput, volumeDb: number) => Promise<void>;
  onMuteChange: (input: ObsAudioInput, muted: boolean) => Promise<void>;
}) {
  const theme = useTheme();
  const [volumeDb, setVolumeDb] = useState(input.volumeDb);
  const editingRef = useRef(false);
  const touchingRef = useRef(false);
  const dirtyRef = useRef(false);
  const latestDbRef = useRef(input.volumeDb);
  const lastSentRef = useRef(0);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editingRef.current) {
      setVolumeDb(input.volumeDb);
      latestDbRef.current = input.volumeDb;
    }
  }, [input.volumeDb]);

  useEffect(() => () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
  }, []);

  const finishVolume = () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = null;
    if (!dirtyRef.current) {
      editingRef.current = false;
      setVolumeDb(input.volumeDb);
      return;
    }
    void onVolumeChange(input, latestDbRef.current)
      .catch(() => {
        setVolumeDb(input.volumeDb);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      })
      .finally(() => {
        editingRef.current = false;
        dirtyRef.current = false;
        lastSentRef.current = 0;
      });
  };

  const changeVolume = (deflection: number) => {
    if (disabled) return;
    const nextDb = obsFaderToDb(deflection);
    editingRef.current = true;
    dirtyRef.current = true;
    latestDbRef.current = nextDb;
    setVolumeDb(nextDb);

    const now = Date.now();
    if (now - lastSentRef.current >= 50) {
      lastSentRef.current = now;
      void onVolumeChange(input, nextDb).catch(() => undefined);
    }

    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = setTimeout(() => {
      finishTimerRef.current = null;
      if (!touchingRef.current) finishVolume();
    }, 120);
  };

  const adjustVolume = (direction: -1 | 1) => {
    const nextDeflection = Math.max(0, Math.min(1, obsDbToFader(volumeDb) + direction * 0.05));
    changeVolume(nextDeflection);
  };

  return (
    <View style={[styles.audioRow, { borderColor: theme.border }]}>
      <View style={styles.audioHeading}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.audioName}>{input.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{formatObsDb(volumeDb)}</ThemedText>
      </View>
      <View style={styles.audioControls}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityState={{ disabled }}
          accessibilityLabel={`Volume ${input.name}`}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(obsDbToFader(volumeDb) * 100), text: formatObsDb(volumeDb) }}
          accessibilityActions={[{ name: 'decrement', label: 'Kecilkan volume' }, { name: 'increment', label: 'Besarkan volume' }]}
          onAccessibilityAction={({ nativeEvent }) => {
            if (disabled) return;
            if (nativeEvent.actionName === 'decrement') adjustVolume(-1);
            if (nativeEvent.actionName === 'increment') adjustVolume(1);
          }}
          onTouchStart={() => {
            touchingRef.current = true;
            editingRef.current = true;
          }}
          onTouchEnd={() => {
            touchingRef.current = false;
            finishVolume();
          }}
          onTouchCancel={() => {
            touchingRef.current = false;
            finishVolume();
          }}
          style={styles.sliderWrapper}>
          <View importantForAccessibility="no-hide-descendants">
            <Slider
              value={obsDbToFader(volumeDb)}
              minimumValue={0}
              maximumValue={1}
              disabled={disabled}
              minimumTrackTintColor={theme.text}
              maximumTrackTintColor={theme.backgroundElement}
              thumbTintColor={theme.text}
              onValueChange={changeVolume}
              style={styles.slider}
            />
          </View>
        </View>
        <IconButton
          accessibilityLabel={`${input.muted ? 'Aktifkan' : 'Bisukan'} ${input.name}`}
          icon={{ ios: input.muted ? 'speaker.slash.fill' : 'speaker.wave.2.fill', android: input.muted ? 'volume_off' : 'volume_up' }}
          active={input.muted}
          tone="danger"
          disabled={disabled}
          onPress={() => {
            void onMuteChange(input, !input.muted)
              .then(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
              .catch(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
          }}
        />
      </View>
    </View>
  );
}

export function ObsControls({
  config,
  onStatusChange,
}: {
  config: ObsConfig;
  onStatusChange?: (status: PanelStatus) => void;
}) {
  const { settings, setSettings } = useApp();
  const obs = useObs(config);
  const [openSections, setOpenSections] = useState({ scenes: true, sources: true, audio: true });
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

  const sourceItems = useMemo(
    () => orderItems(obs.items, settings.obsSourceOrder[obs.activeScene] ?? [], (item) => item.key),
    [obs.activeScene, obs.items, settings.obsSourceOrder],
  );
  const audioInputs = useMemo(
    () => orderItems(obs.audioInputs, settings.obsAudioOrder[obs.activeScene] ?? [], (input) => input.name),
    [obs.activeScene, obs.audioInputs, settings.obsAudioOrder],
  );
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };
  const reorderSources = (from: number, to: number) => {
    const order = moveItem(sourceItems, from, to).map((item) => item.key);
    setSettings((current) => ({
      ...current,
      obsSourceOrder: { ...current.obsSourceOrder, [obs.activeScene]: order },
    }));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const reorderAudio = (from: number, to: number) => {
    const order = moveItem(audioInputs, from, to).map((input) => input.name);
    setSettings((current) => ({
      ...current,
      obsAudioOrder: { ...current.obsAudioOrder, [obs.activeScene]: order },
    }));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

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
        <ObsSection title="Scene program" open={openSections.scenes} onToggle={() => toggleSection('scenes')}>
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
        </ObsSection>

        <ObsSection
          title={`Source · ${obs.activeScene || 'Belum ada scene aktif'}`}
          open={openSections.sources}
          onToggle={() => toggleSection('sources')}>
          <View>
            {sourceItems.map((item, index) => (
              <SortableRow
                key={item.key}
                index={index}
                count={sourceItems.length}
                label={item.name}
                onMove={reorderSources}
                style={{ paddingLeft: 4 + item.depth * 18 }}>
                <View style={styles.sourceRow}>
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
              </SortableRow>
            ))}
            {!sourceItems.length ? <ThemedText type="small" themeColor="textSecondary">Source dari scene aktif akan muncul di sini.</ThemedText> : null}
          </View>
        </ObsSection>

        <ObsSection title="Mixer audio" open={openSections.audio} onToggle={() => toggleSection('audio')}>
          <View>
            {audioInputs.map((input, index) => (
              <SortableRow
                key={input.name}
                index={index}
                count={audioInputs.length}
                label={input.name}
                onMove={reorderAudio}>
                <AudioMixerRow
                  input={input}
                  disabled={disabled}
                  onVolumeChange={obs.setInputVolume}
                  onMuteChange={obs.setInputMuted}
                />
              </SortableRow>
            ))}
            {!audioInputs.length ? (
              <ThemedText type="small" themeColor="textSecondary">Tidak ada input audio pada scene aktif.</ThemedText>
            ) : null}
          </View>
        </ObsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  statusLine: { minHeight: 38, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 14 },
  section: { borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 8 },
  sectionHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { flex: 1, minWidth: 0 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceCopy: { flex: 1, minWidth: 0 },
  audioRow: { minHeight: 84, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 4 },
  audioHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  audioName: { flex: 1, minWidth: 0 },
  audioControls: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderWrapper: { flex: 1, minWidth: 0, minHeight: 48, justifyContent: 'center' },
  slider: { width: '100%', height: 44 },
  pressed: { opacity: 0.68 },
});
