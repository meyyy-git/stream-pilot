import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function ConsoleSection({
  title,
  action,
  children,
}: PropsWithChildren & {
  title: string;
  action?: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={[styles.tally, { backgroundColor: theme.text }]} />
        <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
        {action}
        <SymbolView
          name={{ ios: 'circle.fill', android: 'circle' }}
          size={7}
          tintColor={theme.textSecondary}
        />
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
  tally: { width: 4, height: 18, borderRadius: 2 },
  title: { flex: 1 },
  content: { flex: 1, minHeight: 0, minWidth: 0 },
});