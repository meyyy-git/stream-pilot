/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#17191B',
    background: '#F4F5F6',
    backgroundElement: '#E8EAEC',
    backgroundSelected: '#D9DCDF',
    textSecondary: '#60676D',
    border: '#C9CDD1',
    control: '#FFFFFF',
    success: '#397357',
    warning: '#9A6A2C',
    danger: '#A34444',
  },
  dark: {
    text: '#F1F2F3',
    background: '#111315',
    backgroundElement: '#1B1E21',
    backgroundSelected: '#292D31',
    textSecondary: '#A8AEB4',
    border: '#363B40',
    control: '#23272A',
    success: '#65A77F',
    warning: '#C79552',
    danger: '#D06A6A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
