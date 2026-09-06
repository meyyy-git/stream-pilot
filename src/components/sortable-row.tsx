import { SymbolView } from 'expo-symbols';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { Animated, PanResponder, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function SortableRow({
  index,
  count,
  label,
  onMove,
  style,
  children,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (from: number, to: number) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const theme = useTheme();
  const [translateY] = useState(() => new Animated.Value(0));
  const [rowHeight, setRowHeight] = useState(1);
  const [dragging, setDragging] = useState(false);
  const move = useCallback((to: number) => {
    const target = Math.max(0, Math.min(count - 1, to));
    if (target !== index) onMove(index, target);
  }, [count, index, onMove]);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => count > 1,
    onMoveShouldSetPanResponder: () => count > 1,
    onPanResponderGrant: () => setDragging(true),
    onPanResponderMove: (_, gesture) => translateY.setValue(gesture.dy),
    onPanResponderRelease: (_, gesture) => {
      translateY.setValue(0);
      setDragging(false);
      move(index + Math.round(gesture.dy / rowHeight));
    },
    onPanResponderTerminate: () => {
      translateY.setValue(0);
      setDragging(false);
    },
    onPanResponderTerminationRequest: () => false,
  }), [count, index, move, rowHeight, translateY]);

  return (
    <Animated.View
      onLayout={({ nativeEvent }) => setRowHeight(nativeEvent.layout.height)}
      style={[styles.row, style, dragging && styles.dragging, { transform: [{ translateY }] }]}>
      <View style={styles.content}>{children}</View>
      <View
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Ubah urutan ${label}`}
        accessibilityHint="Seret ke atas atau bawah."
        accessibilityState={{ disabled: count < 2 }}
        accessibilityActions={[
          { name: 'moveUp', label: 'Pindahkan ke atas' },
          { name: 'moveDown', label: 'Pindahkan ke bawah' },
        ]}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === 'moveUp') move(index - 1);
          if (nativeEvent.actionName === 'moveDown') move(index + 1);
        }}
        style={styles.handle}>
        <SymbolView name={{ ios: 'line.3.horizontal', android: 'drag_handle' }} size={22} tintColor={theme.textSecondary} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1, minWidth: 0 },
  handle: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  dragging: { zIndex: 2, opacity: 0.82 },
});
