import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PanelStatus } from '@/components/console-section';
import { ControlButton, IconButton, PanelEmptyState, StatusLabel } from '@/components/control-ui';
import { ThemedText } from '@/components/themed-text';
import { isTrakteerActionUrl, TrakteerConfig } from '@/lib/domain';
import { triggerTrakteerAction } from '@/lib/trakteer';

type Feedback = { label: string; state: 'pending' | 'success' | 'error' };

export function TrakteerControls({
  config,
  onStatusChange,
}: {
  config: TrakteerConfig;
  onStatusChange?: (status: PanelStatus) => void;
}) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, setPending] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [gachaVisible, setGachaVisible] = useState(true);
  const [censorText, setCensorText] = useState(false);
  const [censorMedia, setCensorMedia] = useState(false);
  const controlUrls = [
    config.previous,
    config.play,
    config.pause,
    config.next,
    config.censorText,
    config.censorMedia,
    config.gachaSpin,
    config.gachaHide,
    config.gachaShow,
  ];
  const readyCount = controlUrls.filter(isTrakteerActionUrl).length;
  const panelStatus: PanelStatus = feedback?.state === 'error'
    ? 'error'
    : pending || (readyCount > 0 && readyCount < controlUrls.length)
      ? 'connecting'
      : readyCount === controlUrls.length
        ? 'ready'
        : 'unconfigured';

  useEffect(() => {
    onStatusChange?.(panelStatus);
  }, [onStatusChange, panelStatus]);

  useEffect(() => {
    if (feedback?.state !== 'success') return;
    const timeout = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const disabled = (url: string) => pending || !isTrakteerActionUrl(url);
  const run = async (label: string, url: string, onSuccess?: () => string | void) => {
    setPending(true);
    setFeedback({ label: 'Menjalankan aksi…', state: 'pending' });
    try {
      await triggerTrakteerAction(url);
      const successLabel = onSuccess?.();
      setFeedback({ label: successLabel || 'Overlay diperbarui', state: 'success' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setFeedback({ label: 'Belum berhasil. Periksa koneksi lalu coba lagi.', state: 'error' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setPending(false);
    }
  };

  const playbackUrl = playing ? config.pause : config.play;
  const playbackLabel = playing ? 'Jeda' : 'Putar';
  const visibilityUrl = gachaVisible ? config.gachaHide : config.gachaShow;
  const visibilityLabel = gachaVisible ? 'Sembunyikan Gacha' : 'Tampilkan Gacha';

  if (!readyCount) {
    return (
      <PanelEmptyState
        icon={{ ios: 'slider.horizontal.3', android: 'tune' }}
        title="Atur kontrol Trakteer"
        description="Tambahkan Action URL agar overlay dapat dikontrol dari konsol ini."
        actionLabel="Atur Trakteer"
        onAction={() => router.push('/settings')}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {feedback ? (
        <StatusLabel live tone={feedback.state === 'pending' ? 'warning' : feedback.state === 'success' ? 'success' : 'danger'}>
          {feedback.label}
        </StatusLabel>
      ) : readyCount < controlUrls.length ? (
        <StatusLabel tone="warning">{readyCount} dari {controlUrls.length} aksi siap</StatusLabel>
      ) : null}

      <View style={styles.group}>
        <ThemedText type="smallBold">Alert + Mediashare</ThemedText>
        <View style={styles.controlStrip}>
          <View style={styles.playbackRow}>
            <IconButton
              accessibilityLabel="Sebelumnya"
              icon={{ ios: 'backward.end.fill', android: 'skip_previous' }}
              disabled={disabled(config.previous)}
              onPress={() => void run('aksi sebelumnya', config.previous)}
            />
            <IconButton
              accessibilityLabel={playbackLabel}
              icon={playing ? { ios: 'pause.fill', android: 'pause' } : { ios: 'play.fill', android: 'play_arrow' }}
              disabled={disabled(playbackUrl)}
              onPress={() => void run(playbackLabel, playbackUrl, () => setPlaying((value) => !value))}
            />
            <IconButton
              accessibilityLabel="Berikutnya"
              icon={{ ios: 'forward.end.fill', android: 'skip_next' }}
              disabled={disabled(config.next)}
              onPress={() => void run('aksi berikutnya', config.next)}
            />
          </View>
          <View style={styles.censorGroup}>
            <ThemedText type="smallBold" themeColor="textSecondary">Sensor</ThemedText>
            <View style={styles.censorRow}>
              <ControlButton
                label="Teks"
                icon={{ ios: 'textformat', android: 'text_fields' }}
                active={censorText}
                disabled={disabled(config.censorText)}
                onPress={() => void run('sensor teks', config.censorText, () => {
                  const next = !censorText;
                  setCensorText(next);
                  return `Sensor teks ${next ? 'aktif' : 'nonaktif'}`;
                })}
                style={styles.censorButton}
              />
              <ControlButton
                label="Media"
                icon={{ ios: 'eye.slash', android: 'visibility_off' }}
                active={censorMedia}
                disabled={disabled(config.censorMedia)}
                onPress={() => void run('sensor media', config.censorMedia, () => {
                  const next = !censorMedia;
                  setCensorMedia(next);
                  return `Sensor media ${next ? 'aktif' : 'nonaktif'}`;
                })}
                style={styles.censorButton}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold">Gacha</ThemedText>
        <View style={styles.playbackRow}>
          <ControlButton
            label="Putar"
            icon={{ ios: 'arrow.clockwise.circle', android: 'refresh' }}
            disabled={disabled(config.gachaSpin)}
            onPress={() => void run('Gacha', config.gachaSpin, () => 'Gacha diputar')}
            style={styles.spinButton}
          />
          <IconButton
            accessibilityLabel={visibilityLabel}
            icon={gachaVisible ? { ios: 'eye.slash', android: 'visibility_off' } : { ios: 'eye', android: 'visibility' }}
            disabled={disabled(visibilityUrl)}
            onPress={() => void run(visibilityLabel, visibilityUrl, () => {
              const next = !gachaVisible;
              setGachaVisible(next);
              return `Gacha ${next ? 'ditampilkan' : 'disembunyikan'}`;
            })}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 24 },
  group: { gap: 12 },
  controlStrip: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 18 },
  playbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  censorGroup: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  censorRow: { flexDirection: 'row', gap: 8 },
  censorButton: { minWidth: 96, flexBasis: 'auto', flexGrow: 0 },
  spinButton: { minWidth: 112, flexBasis: 'auto', flexGrow: 0 },
});
