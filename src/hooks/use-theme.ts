/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useApp } from '@/providers/app-provider';

export function useTheme() {
  return useApp().colors;
}
