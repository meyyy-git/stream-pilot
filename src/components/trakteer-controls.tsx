import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ControlButton, IconButton, StatusLabel } from '@/components/control-ui';
import { ThemedText } from '@/components/themed-text';
import { isTrakteerActionUrl, TrakteerConfig } from '@/lib/domain';
import { triggerTrakteerAction } from '@/lib/trakteer';

type Feedback = { label: string; state: 'pending' | 'success' | 'error' };

export function TrakteerControls({ config }: { config: TrakteerConfig }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, setPending] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [gachaVisible, setGachaVisible] = useState(true);
  const [censorText, setCensorText] = useState(false);
  const [censorMedia, setCensorMedia] = useState(false);

  const disabled = (url: string) => pending || !isTrakteerActionUrl(url);
  const run = async (label: string, url: string, onSuccess?: () => string | void) => {
    setPending(true);
    setFeedback({ label: `${label} dikirim…`, state: 'pending' });
    try {
      await triggerTrakteerAction(url);
      const successLabel = onSuccess?.();
      setFeedback({ label: successLabel || `${label} berhasil`, state: 'success' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (reason) {
      setFeedback({ label: reason instanceof Error ? reason.message : 'Aksi gagal.', state: 'error' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setPending(false);
    }
  };

  const playbackUrl = playing ? config.pause : config.play;
  const playbackLabel = playing ? 'Pause' : 'Play';
  const visibilityUrl = gachaVisible ? config.gachaHide : config.gachaShow;
  const visibilityLabel = gachaVisible ? 'Hide Gacha' : 'Show Gacha';

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {feedback ? (
        <StatusLabel live tone={feedback.state === 'pending' ? 'warning' : feedback.state === 'success' ? 'success' : 'danger'}>
          {feedback.label}
        </StatusLabel>
      ) : (
        <StatusLabel>Kontrol overlay</StatusLabel>
      )}

      <View style={styles.group}>
        <ThemedText type="smallBold">ALERT + MEDIASHARE</ThemedText>
        <View style={styles.controlStrip}>
          <View style={styles.playbackRow}>
            <IconButton
              accessibilityLabel="Previous"
              icon={{ ios: 'backward.end.fill', android: 'skip_previous' }}
              disabled={disabled(config.previous)}
              onPress={() => void run('Previous', config.previous)}
            />
            <IconButton
              accessibilityLabel={playbackLabel}
              icon={playing ? { ios: 'pause.fill', android: 'pause' } : { ios: 'play.fill', android: 'play_arrow' }}
              disabled={disabled(playbackUrl)}
              onPress={() => void run(playbackLabel, playbackUrl, () => setPlaying((value) => !value))}
            />
            <IconButton
              accessibilityLabel="Next"
              icon={{ ios: 'forward.end.fill', android: 'skip_next' }}
              disabled={disabled(config.next)}
              onPress={() => void run('Next', config.next)}
            />
          </View>
          <View style={styles.censorGroup}>
            <ThemedText type="smallBold" themeColor="textSecondary">Censor:</ThemedText>
            <View style={styles.censorRow}>
              <ControlButton
                label="Text"
                icon={{ ios: 'textformat', android: 'text_fields' }}
                active={censorText}
                disabled={disabled(config.censorText)}
                onPress={() => void run('Censor Text', config.censorText, () => {
                  const next = !censorText;
                  setCensorText(next);
                  return `Censor Text ${next ? 'aktif' : 'nonaktif'}`;
                })}
                style={styles.censorButton}
              />
              <ControlButton
                label="Media"
                icon={{ ios: 'eye.slash', android: 'visibility_off' }}
                active={censorMedia}
                disabled={disabled(config.censorMedia)}
                onPress={() => void run('Censor Media', config.censorMedia, () => {
                  const next = !censorMedia;
                  setCensorMedia(next);
                  return `Censor Media ${next ? 'aktif' : 'nonaktif'}`;
                })}
                style={styles.censorButton}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold">GACHA</ThemedText>
        <View style={styles.playbackRow}>
          <ControlButton
            label="Putar"
            icon={{ ios: 'arrow.clockwise.circle', android: 'refresh' }}
            disabled={disabled(config.gachaSpin)}
            onPress={() => void run('Putar Gacha', config.gachaSpin)}
            style={styles.spinButton}
          />
          <IconButton
            accessibilityLabel={visibilityLabel}
            icon={gachaVisible ? { ios: 'eye.slash', android: 'visibility_off' } : { ios: 'eye', android: 'visibility' }}
            disabled={disabled(visibilityUrl)}
            onPress={() => void run(visibilityLabel, visibilityUrl, () => setGachaVisible((value) => !value))}
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
