import { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type PanelStatus = 'unconfigured' | 'connecting' | 'ready' | 'error';

export function ConsoleSection({
  title,
  action,
  status = 'unconfigured',
  children,
}: PropsWithChildren & {
  title: string;
  action?: ReactNode;
  status?: PanelStatus;
}) {
  const theme = useTheme();
  const statusColor = {
    unconfigured: theme.textSecondary,
    connecting: theme.warning,
    ready: theme.success,
    error: theme.danger,
  }[status];
  const statusLabel = {
    unconfigured: 'Belum disetel',
    connecting: 'Sedang diproses',
    ready: 'Siap',
    error: 'Bermasalah',
  }[status];

  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View
          accessible
          accessibilityLabel={`Status ${title}: ${statusLabel}`}
          style={[styles.statusDot, { backgroundColor: statusColor }]}
        />
        <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
        {action}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  title: { flex: 1 },
  content: { flex: 1, minHeight: 0, minWidth: 0 },
});
