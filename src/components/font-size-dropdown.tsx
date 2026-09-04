import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { ChatFontSize, chatFontSizes } from '@/lib/domain';

export function FontSizeDropdown({
  value,
  onChange,
  compact = false,
  style,
}: {
  value: ChatFontSize;
  onChange: (size: ChatFontSize) => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleSelect = (size: ChatFontSize) => {
    void Haptics.selectionAsync();
    onChange(size);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ukuran teks chat saat ini ${value} piksel. Tekan untuk mengubah.`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          compact ? styles.compactTrigger : styles.fullTrigger,
          {
            backgroundColor: theme.control,
            borderColor: theme.border,
          },
          pressed && styles.pressed,
          style,
        ]}>
        <View style={styles.triggerContent}>
          <SymbolView
            name={{ ios: 'textformat.size', android: 'format_size' }}
            size={compact ? 13 : 16}
            tintColor={theme.text}
          />
          <ThemedText type={compact ? 'smallBold' : 'default'} style={compact ? styles.compactText : undefined}>
            {compact ? `${value}px` : `Ukuran Teks (${value}px)`}
          </ThemedText>
        </View>
        <SymbolView
          name={{ ios: 'chevron.down', android: 'expand_more' }}
          size={compact ? 11 : 14}
          tintColor={theme.textSecondary}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityLabel="Tutup menu ukuran teks"
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />

          <View
            style={[
              styles.dialog,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <View style={[styles.dialogHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.dialogHeaderTitles}>
                <ThemedText type="smallBold">Pilih ukuran teks live chat</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Perubahan langsung diterapkan pada chat YouTube.
                </ThemedText>
              </View>
              <Pressable
                accessibilityLabel="Tutup"
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                hitSlop={8}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close' }}
                  size={14}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={styles.optionsListContent}
              showsVerticalScrollIndicator={false}>
              {chatFontSizes.map((size) => {
                const active = size === value;
                return (
                  <Pressable
                    key={size}
                    accessibilityRole="button"
                    accessibilityLabel={`${size} piksel`}
                    accessibilityState={{ selected: active }}
                    onPress={() => handleSelect(size)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      active && { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.optionLabel,
                        { color: active ? theme.text : theme.textSecondary },
                      ]}>
                      {size} px
                    </ThemedText>

                    <View style={styles.optionPreview}>
                      <ThemedText
                        style={{
                          fontSize: Math.min(20, Math.max(11, size)),
                          lineHeight: Math.min(24, Math.max(14, size + 2)),
                          color: active ? theme.text : theme.textSecondary,
                          fontWeight: active ? '700' : '500',
                        }}>
                        Aa
                      </ThemedText>
                      {active ? (
                        <SymbolView
                          name={{ ios: 'checkmark', android: 'check' }}
                          size={16}
                          weight="semibold"
                          tintColor={theme.text}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactTrigger: {
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullTrigger: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  dialogHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  dialogHeaderTitles: {
    flex: 1,
    gap: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  optionsList: {
    maxHeight: 320,
  },
  optionsListContent: {
    padding: 8,
    gap: 4,
  },
  optionRow: {
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 15,
  },
  optionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressed: {
    opacity: 0.68,
  },
});
