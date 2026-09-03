import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { ControlButton, StatusLabel } from '@/components/control-ui';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { parseObsQrCode } from '@/lib/domain';
import { useApp } from '@/providers/app-provider';

export default function ObsQrScannerScreen() {
  const theme = useTheme();
  const { setSettings } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');

  const handleScan = ({ data }: BarcodeScanningResult) => {
    if (locked) return;
    setLocked(true);

    const obs = parseObsQrCode(data);
    if (!obs) {
      setError('QR tidak dikenali. Gunakan QR Connect Info dari OBS WebSocket 5.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSettings((current) => ({ ...current, obs }));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  if (!permission) {
    return (
      <View style={[styles.permission, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.text} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permission, { backgroundColor: theme.background }]}>
        <ThemedText type="subtitle" style={styles.center}>Akses kamera diperlukan</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Kamera hanya digunakan untuk membaca QR koneksi OBS. Isi QR diproses dan disimpan di perangkat ini.
        </ThemedText>
        <ControlButton
          label={permission.canAskAgain ? 'Izinkan Kamera' : 'Buka Pengaturan Perangkat'}
          onPress={() => void (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={locked ? undefined : handleScan}
        onMountError={({ message }) => {
          setLocked(true);
          setError(`Kamera tidak dapat dibuka: ${message}`);
        }}
      />
      <View pointerEvents="none" style={styles.guide}>
        <View style={styles.frame} />
      </View>
      <View style={[styles.instructions, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {error ? (
          <>
            <StatusLabel live tone="danger">{error}</StatusLabel>
            <ControlButton
              label="Scan Ulang"
              onPress={() => {
                setError('');
                setLocked(false);
              }}
              style={styles.retryButton}
            />
          </>
        ) : (
          <>
            <ThemedText type="smallBold">Arahkan kamera ke QR Connect Info OBS</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Host, port, dan password akan terisi otomatis. Uji koneksi setelah kembali ke Pengaturan.
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  guide: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 },
  frame: { width: '68%', maxWidth: 340, aspectRatio: 1, borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 16 },
  instructions: {
    position: 'absolute',
    bottom: 20,
    width: '90%',
    maxWidth: 460,
    alignSelf: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  permissionButton: { flexGrow: 0, flexBasis: 'auto', minWidth: 180 },
  retryButton: { flexGrow: 0, flexBasis: 'auto', alignSelf: 'flex-start', minWidth: 120 },
  center: { textAlign: 'center', maxWidth: 420 },
});
