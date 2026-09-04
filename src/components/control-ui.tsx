import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type IconName = SymbolViewProps['name'];

export function IconButton({
  accessibilityLabel,
  icon,
  onPress,
  disabled,
}: {
  accessibilityLabel: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: theme.control, borderColor: theme.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <SymbolView name={icon} size={18} weight="semibold" tintColor={theme.text} />
    </Pressable>
  );
}

export function StatusLabel({ tone = 'neutral', live = false, children }: PropsWithChildren & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  live?: boolean;
}) {
  const theme = useTheme();
  const color = tone === 'neutral' ? theme.textSecondary : theme[tone];
  return (
    <View style={styles.statusRow} accessibilityLiveRegion={live ? 'polite' : 'none'}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <ThemedText type="small" style={{ color }}>{children}</ThemedText>
    </View>
  );
}

export function PanelEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'textSecondary',
}: {
  icon: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'textSecondary' | 'danger';
}) {
  const theme = useTheme();

  return (
    <View style={styles.emptyState}>
      <SymbolView name={icon} size={38} tintColor={theme[tone]} />
      <View style={styles.emptyCopy}>
        <ThemedText type="smallBold" style={styles.emptyTitle}>{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyDescription}>
          {description}
        </ThemedText>
      </View>
      {actionLabel && onAction ? (
        <ControlButton label={actionLabel} onPress={onAction} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

export function ControlButton({
  label,
  onPress,
  onLongPress,
  active,
  disabled,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: 'neutral' | 'green' | 'amber' | 'red';
  icon?: IconName;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const toneColor = {
    neutral: theme.text,
    green: theme.success,
    amber: theme.warning,
    red: theme.danger,
  }[tone];
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={260}
      style={({ pressed }) => [
        styles.controlButton,
        { backgroundColor: active ? theme.backgroundSelected : theme.control, borderColor: active ? toneColor : theme.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {icon ? <SymbolView name={icon} size={19} tintColor={active ? toneColor : theme.text} /> : null}
      <ThemedText type="smallBold" numberOfLines={2} style={{ color: active ? toneColor : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Field({ label, error, action, ...props }: TextInputProps & { label: string; error?: string; action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.fieldGroup}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.text}
          style={[styles.input, { color: theme.text, backgroundColor: theme.control, borderColor: error ? theme.danger : theme.border }]}
          {...props}
        />
        {action}
      </View>
      {error ? <ThemedText type="small" style={{ color: theme.danger }}>{error}</ThemedText> : null}
    </View>
  );
}

export function SettingsBlock({ title, description, children, action }: PropsWithChildren & {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.settingsBlock, { borderColor: theme.border }]}>
      <View style={styles.blockHeading}>
        <View style={styles.blockCopy}>
          <ThemedText type="subtitle" style={styles.blockTitle}>{title}</ThemedText>
          {description ? <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 48,
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.68 },
  disabled: { opacity: 0.42 },
  statusRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  emptyCopy: { alignItems: 'center', gap: 5, maxWidth: 340 },
  emptyTitle: { fontSize: 17, lineHeight: 23, textAlign: 'center' },
  emptyDescription: { textAlign: 'center' },
  emptyAction: { flexGrow: 0, flexBasis: 'auto', minWidth: 180 },
  controlButton: {
    minHeight: 52,
    minWidth: 72,
    flexGrow: 1,
    flexBasis: 92,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldGroup: { gap: 7 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  settingsBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 24,
    gap: 18,
  },
  blockHeading: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  blockCopy: { flex: 1, gap: 4 },
  blockTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
});
