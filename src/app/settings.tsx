import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import type { PanelStatus } from '@/components/console-section';
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
const TRAKTEER_STREAM_SETTINGS_URL = 'https://trakteer.id/v2/manage/stream-settings';

const alertFields: UrlField[] = [
  { key: 'previous', label: 'Sebelumnya' },
  { key: 'play', label: 'Putar' },
  { key: 'pause', label: 'Jeda' },
  { key: 'next', label: 'Berikutnya' },
  { key: 'censorText', label: 'Sensor teks' },
  { key: 'censorMedia', label: 'Sensor media' },
];

const gachaFields: UrlField[] = [
  { key: 'gachaSpin', label: 'Putar' },
  { key: 'gachaHide', label: 'Sembunyikan' },
  { key: 'gachaShow', label: 'Tampilkan' },
];

const testFields: UrlField[] = [
  { key: 'testNotification', label: 'Uji notifikasi' },
  { key: 'testYouTube', label: 'Uji Mediashare · YouTube' },
  { key: 'testTikTok', label: 'Uji Mediashare · TikTok' },
  { key: 'testInstagram', label: 'Uji Mediashare · Instagram' },
];

function ConnectionDiagnostic({ title, status, trakteer = false }: { title: string; status: PanelStatus; trakteer?: boolean }) {
  const label = status === 'ready'
    ? 'Terhubung'
    : status === 'error'
      ? 'Terputus'
      : status === 'connecting'
        ? trakteer ? 'Sebagian siap' : 'Menghubungkan…'
        : 'Belum disetel';
  const tone = status === 'ready' ? 'success' : status === 'error' ? 'danger' : status === 'connecting' ? 'warning' : 'neutral';

  return (
    <View style={styles.diagnosticRow}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <StatusLabel tone={tone}>{label}</StatusLabel>
    </View>
  );
}

function SettingsDisclosure({
  title,
  summary,
  description,
  open,
  onToggle,
  children,
}: PropsWithChildren & {
  title: string;
  summary: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.disclosure, { borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${summary}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.disclosureHeader, pressed && styles.pressed]}>
        <View style={styles.disclosureCopy}>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{summary}</ThemedText>
        </View>
        <SymbolView
          name={{ ios: open ? 'chevron.up' : 'chevron.down', android: open ? 'expand_less' : 'expand_more' }}
          size={18}
          tintColor={theme.textSecondary}
        />
      </Pressable>
      {open ? (
        <View style={styles.disclosureContent}>
          {description ? <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText> : null}
          {children}
        </View>
      ) : null}
    </View>
  );
}

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
      error={value && !valid ? 'Link belum valid. Gunakan Action URL HTTPS dari Trakteer.' : undefined}
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
              accessibilityLabel={`Jalankan ${label.toLowerCase()}`}
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
  const { settings, setSettings, update, checkForUpdates, panelStatuses } = useApp();
  const [showPreview, setShowPreview] = useState(false);
  const [showObsManual, setShowObsManual] = useState(false);
  const [openTrakteerGroup, setOpenTrakteerGroup] = useState<'alert' | 'gacha' | 'test' | null>('alert');
  const [obsTest, setObsTest] = useState<{ label: string; state: 'pending' | 'success' | 'error' } | null>(null);
  const [trakteerTest, setTrakteerTest] = useState<string | null>(null);

  const updateTrakteer = (key: keyof TrakteerConfig, value: string) => {
    setSettings((current) => ({
      ...current,
      trakteer: { ...current.trakteer, [key]: value },
    }));
  };
  const progress = (fields: UrlField[]) =>
    `${fields.filter((field) => isTrakteerActionUrl(settings.trakteer[field.key])).length} dari ${fields.length} aksi siap`;

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
              Alert.alert('Pengujian berhasil', `${label} sudah dikirim ke overlay.`);
            })
            .catch(() => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Pengujian belum berhasil', 'Periksa koneksi dan Action URL, lalu coba lagi.');
            })
            .finally(() => setTrakteerTest(null));
        },
      },
    ]);
  };
  const updateMessage = update.status === 'checking'
    ? 'Memeriksa rilis terbaru…'
    : update.status === 'available'
      ? `Versi ${update.latestVersion} tersedia.`
      : update.status === 'current'
        ? `Versi ${update.currentVersion} sudah terbaru.`
        : 'Belum dapat memeriksa pembaruan. Periksa koneksi internet lalu coba lagi.';
  const updateButtonLabel = update.status === 'checking'
    ? 'Memeriksa…'
    : update.status === 'available'
      ? `${Platform.OS === 'android' ? 'Unduh' : 'Lihat rilis'} versi ${update.latestVersion}`
      : update.status === 'error'
        ? 'Coba lagi'
        : 'Cek lagi';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <ThemedText themeColor="textSecondary">
          Semua perubahan tersimpan otomatis. Password OBS dan Action URL tetap aman di perangkat ini.
        </ThemedText>
      </View>

      <SettingsBlock title="Koneksi" description="Status mengikuti Live Console yang sedang aktif.">
        <View style={styles.diagnosticList}>
          <ConnectionDiagnostic title="Live chat" status={panelStatuses.chat} />
          <ConnectionDiagnostic title="OBS" status={panelStatuses.obs} />
          <ConnectionDiagnostic title="Trakteer" status={panelStatuses.trakteer} trakteer />
        </View>
      </SettingsBlock>

      <SettingsBlock
        title="Live chat"
        description="Tambahkan link video atau siaran langsung YouTube. Tidak perlu API key.">
        <Field
          label="Link YouTube"
          value={settings.streamLink}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://youtube.com/watch?v=…"
          onChangeText={(streamLink) => setSettings((current) => ({ ...current, streamLink }))}
        />
        <View style={styles.preferenceGroup}>
          <ThemedText type="smallBold">Ukuran teks live chat</ThemedText>
          <FontSizeDropdown
            value={settings.chatFontSize}
            onChange={(chatFontSize) => setSettings((current) => ({ ...current, chatFontSize }))}
          />
        </View>
        <ControlButton
          label={showPreview ? 'Tutup preview' : 'Preview live chat'}
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
        description="Hubungkan perangkat ini dan komputer OBS ke jaringan lokal yang sama.">
        <View style={styles.setupLead}>
          <View style={styles.setupCopy}>
            <ThemedText type="smallBold">Cara tercepat</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Buka Tools → WebSocket Server Settings → Show Connect Info di OBS, lalu pindai QR-nya.
            </ThemedText>
          </View>
          <ControlButton
            label="Pindai QR dari OBS"
            icon={{ ios: 'qrcode.viewfinder', android: 'qr_code_scanner' }}
            onPress={() => router.push('/obs-qr-scanner')}
            style={styles.fitButton}
          />
        </View>

        <SettingsDisclosure
          title="Isi manual"
          summary={settings.obs.host ? `${settings.obs.host}:${settings.obs.port || '4455'}` : 'Alternatif jika QR tidak tersedia'}
          open={showObsManual}
          onToggle={() => setShowObsManual((value) => !value)}>
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
            label="Password OBS"
            value={settings.obs.password}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="Password WebSocket OBS"
            onChangeText={(password) => setSettings((current) => ({ ...current, obs: { ...current.obs, password } }))}
          />
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <ThemedText type="smallBold">Koneksi aman (WSS)</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Aktifkan hanya jika OBS sudah memakai sertifikat TLS/SSL.</ThemedText>
            </View>
            <Switch
              value={settings.obs.secure}
              onValueChange={(secure) => setSettings((current) => ({ ...current, obs: { ...current.obs, secure } }))}
            />
          </View>
        </SettingsDisclosure>

        <View style={styles.inlineActions}>
          <ControlButton
            label={obsTest?.state === 'pending' ? 'Menguji…' : 'Uji koneksi'}
            disabled={obsTest?.state === 'pending' || !settings.obs.host.trim()}
            onPress={() => {
              setObsTest({ label: 'Menghubungkan ke OBS…', state: 'pending' });
              void testObsConnection(settings.obs)
                .then((version) => {
                  setObsTest({ label: `Terhubung ke OBS WebSocket ${version}`, state: 'success' });
                  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                })
                .catch(() => {
                  setObsTest({ label: 'Belum dapat terhubung. Periksa jaringan dan detail koneksi.', state: 'error' });
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
        description="Salin Action URL dari Stream Overlay Control, lalu tempel sesuai aksinya.">
        <View style={styles.trakteerGuide}>
          <ThemedText type="small" themeColor="textSecondary">
            Buat atau salin Action URL dari pengaturan Stream Overlay Trakteer, termasuk kebutuhan Stream Deck.
          </ThemedText>
          <ControlButton
            label="Buka pengaturan Trakteer"
            onPress={() => void Linking.openURL(TRAKTEER_STREAM_SETTINGS_URL).catch(() => {
              Alert.alert('Halaman belum dapat dibuka', 'Coba buka link pengaturan Trakteer dari browser.');
            })}
            style={styles.fitButton}
          />
        </View>
        <SettingsDisclosure
          title="Alert + Mediashare"
          summary={progress(alertFields)}
          description="Kontrol antrean alert, playback Mediashare, serta sensor teks dan media."
          open={openTrakteerGroup === 'alert'}
          onToggle={() => setOpenTrakteerGroup((current) => current === 'alert' ? null : 'alert')}>
          {alertFields.map((field) => (
            <TrakteerUrlField
              key={field.key}
              label={field.label}
              value={settings.trakteer[field.key]}
              onChangeText={(value) => updateTrakteer(field.key, value)}
            />
          ))}
        </SettingsDisclosure>

        <SettingsDisclosure
          title="Gacha"
          summary={progress(gachaFields)}
          description="Kontrol untuk memutar, menyembunyikan, dan menampilkan widget Gacha."
          open={openTrakteerGroup === 'gacha'}
          onToggle={() => setOpenTrakteerGroup((current) => current === 'gacha' ? null : 'gacha')}>
          {gachaFields.map((field) => (
            <TrakteerUrlField
              key={field.key}
              label={field.label}
              value={settings.trakteer[field.key]}
              onChangeText={(value) => updateTrakteer(field.key, value)}
            />
          ))}
        </SettingsDisclosure>

        <SettingsDisclosure
          title="Uji overlay"
          summary={progress(testFields)}
          description="Gunakan tombol tabung reaksi untuk mengirim pengujian langsung ke overlay."
          open={openTrakteerGroup === 'test'}
          onToggle={() => setOpenTrakteerGroup((current) => current === 'test' ? null : 'test')}>
          {trakteerTest ? <StatusLabel live tone="warning">Menjalankan {trakteerTest.toLowerCase()}…</StatusLabel> : null}
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
        </SettingsDisclosure>
      </SettingsBlock>

      <SettingsBlock title="Tampilan" description="Ikuti tema perangkat atau pilih tampilan yang selalu digunakan.">
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
            <ThemedText type="small" themeColor="textSecondary">Aktif saat konsol siaran sedang dibuka.</ThemedText>
          </View>
          <Switch value={settings.keepAwake} onValueChange={(keepAwake) => setSettings((current) => ({ ...current, keepAwake }))} />
        </View>
      </SettingsBlock>

      <SettingsBlock title="Tentang" description={`Stream Pilot ${update.currentVersion} · rilis Android melalui GitHub.`}>
        <StatusLabel
          live
          tone={update.status === 'current' ? 'success' : update.status === 'error' ? 'danger' : 'warning'}>
          {updateMessage}
        </StatusLabel>
        <ControlButton
          label={updateButtonLabel}
          disabled={update.status === 'checking'}
          onPress={() => {
            if (update.status !== 'available') return void checkForUpdates();
            const url = Platform.OS === 'android' && update.downloadUrl ? update.downloadUrl : update.releaseUrl;
            void Linking.openURL(url).catch(() => {
              Alert.alert('Link belum dapat dibuka', 'Buka halaman GitHub Releases dan coba unduh kembali.');
            });
          }}
          style={styles.fitButton}
        />
      </SettingsBlock>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 820, alignSelf: 'center', padding: 20, paddingBottom: 80, gap: 34 },
  intro: { gap: 8, paddingTop: 12 },
  diagnosticList: { gap: 14 },
  diagnosticRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  fitButton: { flexGrow: 0, flexBasis: 'auto', alignSelf: 'flex-start', minWidth: 150 },
  preview: { height: 360, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  inlineActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  setupLead: { gap: 12 },
  setupCopy: { gap: 4, maxWidth: 620 },
  trakteerGuide: { gap: 10 },
  disclosure: { borderTopWidth: StyleSheet.hairlineWidth },
  disclosureHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 10 },
  disclosureCopy: { flex: 1, minWidth: 0, gap: 2 },
  disclosureContent: { gap: 14, paddingBottom: 18 },
  pressed: { opacity: 0.68 },
  urlActions: { flexDirection: 'row', gap: 8 },
  preferenceGroup: { gap: 8 },
  preferenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 56 },
  switchCopy: { flex: 1, gap: 2 },
});
