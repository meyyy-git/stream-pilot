import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ControlButton, Field, IconButton, SettingsBlock, StatusLabel } from '@/components/control-ui';
import { FontSizeDropdown } from '@/components/font-size-dropdown';
import { LiveChat } from '@/components/live-chat';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { testObsConnection } from '@/hooks/use-obs';
import { isTrakteerActionUrl, ThemePreference, TrakteerConfig } from '@/lib/domain';
import { triggerTrakteerAction } from '@/lib/trakteer';
import { useApp } from '@/providers/app-provider';

type UrlField = { key: keyof TrakteerConfig; label: string };

const alertFields: UrlField[] = [
  { key: 'previous', label: 'Previous' },
  { key: 'play', label: 'Play' },
  { key: 'pause', label: 'Pause' },
  { key: 'next', label: 'Next' },
  { key: 'censorText', label: 'Censor Text' },
  { key: 'censorMedia', label: 'Censor Media' },
];

const gachaFields: UrlField[] = [
  { key: 'gachaSpin', label: 'Putar' },
  { key: 'gachaHide', label: 'Hide' },
  { key: 'gachaShow', label: 'Show' },
];

const testFields: UrlField[] = [
  { key: 'testNotification', label: 'Test Notification' },
  { key: 'testYouTube', label: 'Test Mediashare · YouTube' },
  { key: 'testTikTok', label: 'Test Mediashare · TikTok' },
  { key: 'testInstagram', label: 'Test Mediashare · Instagram' },
];

function TrakteerUrlField({
  label,
  value,
  onChangeText,
  onTest,
  testDisabled,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onTest?: () => void;
  testDisabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const valid = isTrakteerActionUrl(value);

  return (
    <Field
      label={label}
      value={value}
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="url"
      secureTextEntry={!visible}
      placeholder="https://ws.trakteer.id/…"
      error={value && !valid ? 'Gunakan URL HTTPS resmi Trakteer.' : undefined}
      onChangeText={onChangeText}
      action={(
        <View style={styles.urlActions}>
          <IconButton
            accessibilityLabel={`${visible ? 'Sembunyikan' : 'Lihat'} URL ${label}`}
            icon={{ ios: visible ? 'eye.slash' : 'eye', android: visible ? 'visibility_off' : 'visibility' }}
            onPress={() => setVisible((current) => !current)}
          />
          {onTest ? (
            <IconButton
              accessibilityLabel={`Jalankan ${label}`}
              icon={{ ios: 'testtube.2', android: 'science' }}
              disabled={testDisabled || !valid}
              onPress={onTest}
            />
          ) : null}
        </View>
      )}
    />
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, setSettings } = useApp();
  const [showPreview, setShowPreview] = useState(false);
  const [obsTest, setObsTest] = useState<{ label: string; state: 'pending' | 'success' | 'error' } | null>(null);
  const [trakteerTest, setTrakteerTest] = useState<string | null>(null);

  const updateTrakteer = (key: keyof TrakteerConfig, value: string) => {
    setSettings((current) => ({
      ...current,
      trakteer: { ...current.trakteer, [key]: value },
    }));
  };

  const testTrakteer = (label: string, url: string) => {
    Alert.alert('Jalankan pengujian?', `${label} akan benar-benar dikirim ke overlay Trakteer.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Jalankan',
        onPress: () => {
          setTrakteerTest(label);
          void triggerTrakteerAction(url)
            .then(() => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Berhasil', `${label} telah dikirim.`);
            })
            .catch((reason) => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Gagal', reason instanceof Error ? reason.message : 'Pengujian gagal.');
            })
            .finally(() => setTrakteerTest(null));
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <ThemedText themeColor="textSecondary">
          Perubahan disimpan otomatis. Password OBS dan URL Aksi tetap berada di penyimpanan aman perangkat.
        </ThemedText>
      </View>

      <SettingsBlock
        title="LiveChat"
        description="Terima link video/live YouTube atau link popout langsung. Tidak memakai YouTube API.">
        <Field
          label="Tautan siaran"
          value={settings.streamLink}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://youtube.com/watch?v=…"
          onChangeText={(streamLink) => setSettings((current) => ({ ...current, streamLink }))}
        />
        <View style={styles.preferenceGroup}>
          <ThemedText type="smallBold">Ukuran teks chat</ThemedText>
          <FontSizeDropdown
            value={settings.chatFontSize}
            onChange={(chatFontSize) => setSettings((current) => ({ ...current, chatFontSize }))}
          />
        </View>
        <ControlButton
          label={showPreview ? 'Tutup Pratinjau' : 'Pratinjau Chat'}
          onPress={() => setShowPreview((value) => !value)}
          style={styles.fitButton}
        />
        {showPreview ? (
          <View style={[styles.preview, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <LiveChat streamLink={settings.streamLink} />
          </View>
        ) : null}
      </SettingsBlock>

      <SettingsBlock
        title="OBS"
        description="OBS Studio 28+ dan obs-websocket harus aktif pada jaringan lokal yang sama.">
        <Field
          label="Host atau IP"
          value={settings.obs.host}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="192.168.1.10"
          onChangeText={(host) => setSettings((current) => ({ ...current, obs: { ...current.obs, host } }))}
        />
        <Field
          label="Port"
          value={settings.obs.port}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numeric"
          placeholder="4455"
          onChangeText={(port) => setSettings((current) => ({ ...current, obs: { ...current.obs, port } }))}
        />
        <Field
          label="Password"
          value={settings.obs.password}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Password server OBS"
          onChangeText={(password) => setSettings((current) => ({ ...current, obs: { ...current.obs, password } }))}
        />
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <ThemedText type="smallBold">Gunakan koneksi aman (WSS)</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Aktifkan hanya bila sertifikat TLS/SSL telah diatur pada OBS.</ThemedText>
          </View>
          <Switch
            value={settings.obs.secure}
            onValueChange={(secure) => setSettings((current) => ({ ...current, obs: { ...current.obs, secure } }))}
          />
        </View>
        <View style={styles.inlineActions}>
          <ControlButton
            label="Pindai QR"
            icon={{ ios: 'qrcode.viewfinder', android: 'qr_code_scanner' }}
            onPress={() => router.push('/obs-qr-scanner')}
            style={styles.fitButton}
          />
          <ControlButton
            label={obsTest?.state === 'pending' ? 'Menguji…' : 'Uji Koneksi'}
            disabled={obsTest?.state === 'pending'}
            onPress={() => {
              setObsTest({ label: 'Menghubungkan…', state: 'pending' });
              void testObsConnection(settings.obs)
                .then((version) => {
                  setObsTest({ label: `Terhubung ke OBS WebSocket ${version}`, state: 'success' });
                  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                })
                .catch((reason) => {
                  setObsTest({ label: reason instanceof Error ? reason.message : 'Koneksi gagal.', state: 'error' });
                  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                });
            }}
            style={styles.fitButton}
          />
          {obsTest ? (
            <StatusLabel live tone={obsTest.state === 'pending' ? 'warning' : obsTest.state === 'success' ? 'success' : 'danger'}>
              {obsTest.label}
            </StatusLabel>
          ) : null}
        </View>
      </SettingsBlock>

      <SettingsBlock
        title="Trakteer"
        description="Tempel URL API dari Stream Overlay Control. Nama dan susunan aksi sudah ditetapkan.">
        <View style={styles.urlGroup}>
          <ThemedText type="smallBold">ALERT + MEDIASHARE</ThemedText>
          {alertFields.map((field) => (
            <TrakteerUrlField
              key={field.key}
              label={field.label}
              value={settings.trakteer[field.key]}
              onChangeText={(value) => updateTrakteer(field.key, value)}
            />
          ))}
        </View>

        <View style={[styles.urlGroup, styles.dividedGroup, { borderTopColor: theme.border }]}>
          <ThemedText type="smallBold">GACHA</ThemedText>
          {gachaFields.map((field) => (
            <TrakteerUrlField
              key={field.key}
              label={field.label}
              value={settings.trakteer[field.key]}
              onChangeText={(value) => updateTrakteer(field.key, value)}
            />
          ))}
        </View>

        <View style={[styles.urlGroup, styles.dividedGroup, { borderTopColor: theme.border }]}>
          <View style={styles.testHeading}>
            <View style={styles.testCopy}>
              <ThemedText type="smallBold">PENGUJIAN</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Ikon tabung reaksi menjalankan test pada overlay.</ThemedText>
            </View>
            {trakteerTest ? <StatusLabel live tone="warning">Mengirim {trakteerTest}…</StatusLabel> : null}
          </View>
          {testFields.map((field) => (
            <TrakteerUrlField
              key={field.key}
              label={field.label}
              value={settings.trakteer[field.key]}
              testDisabled={Boolean(trakteerTest)}
              onChangeText={(value) => updateTrakteer(field.key, value)}
              onTest={() => testTrakteer(field.label, settings.trakteer[field.key])}
            />
          ))}
        </View>
      </SettingsBlock>

      <SettingsBlock title="Tampilan" description="Gunakan tema sistem atau pilih tampilan tetap.">
        <View style={styles.preferenceRow}>
          {(['system', 'light', 'dark'] as ThemePreference[]).map((preference) => (
            <ControlButton
              key={preference}
              label={{ system: 'Sistem', light: 'Terang', dark: 'Gelap' }[preference]}
              active={settings.theme === preference}
              onPress={() => setSettings((current) => ({ ...current, theme: preference }))}
            />
          ))}
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <ThemedText type="smallBold">Jaga layar tetap menyala</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Aktif hanya ketika Konsol Siaran berada di latar depan.</ThemedText>
          </View>
          <Switch value={settings.keepAwake} onValueChange={(keepAwake) => setSettings((current) => ({ ...current, keepAwake }))} />
        </View>
      </SettingsBlock>

      <SettingsBlock title="Tentang" description="Stream Pilot 1.0.0 · distribusi Android melalui GitHub Releases.">
        <ControlButton label="Cek Pembaruan" disabled onPress={() => undefined} style={styles.fitButton} />
        <ThemedText type="small" themeColor="textSecondary">Tautan GitHub Release belum dikonfigurasi pada repository ini.</ThemedText>
      </SettingsBlock>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 820, alignSelf: 'center', padding: 20, paddingBottom: 80, gap: 34 },
  intro: { gap: 8, paddingTop: 12 },
  fitButton: { flexGrow: 0, flexBasis: 'auto', alignSelf: 'flex-start', minWidth: 150 },
  preview: { height: 360, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  inlineActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  urlGroup: { gap: 14 },
  dividedGroup: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 18 },
  urlActions: { flexDirection: 'row', gap: 8 },
  testHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  testCopy: { flex: 1, minWidth: 220, gap: 3 },
  preferenceGroup: { gap: 8 },
  preferenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 56 },
  switchCopy: { flex: 1, gap: 2 },
});
