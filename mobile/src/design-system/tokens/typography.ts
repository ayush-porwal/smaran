// Use @tamagui/core platform flags — not react-native `Platform`. The Tamagui
// babel plugin loads this config in Node (no RN runtime); importing
// `react-native` here throws → "Missing themes" → compile-time styles disabled.
import { createFont, isWeb, isIos } from '@tamagui/core';

const systemFamily = isWeb
  ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : isIos
    ? 'System'
    : 'sans-serif';

const fontConfig = {
  family: systemFamily,
  size: {
    1: 12,
    2: 13,
    3: 14,
    4: 15,
    5: 16,
    6: 17,
    7: 18,
    8: 20,
    9: 24,
    10: 30,
    11: 32,
    12: 36,
    13: 40,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 20,
    4: 22,
    5: 24,
    6: 26,
    7: 28,
    8: 30,
    9: 34,
    10: 38,
    11: 40,
    12: 44,
    13: 48,
  },
  weight: {
    1: '400',
    2: '400',
    3: '400',
    4: '500',
    5: '500',
    6: '600',
    7: '600',
    8: '700',
    9: '700',
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: -0.25,
    9: -0.5,
    10: -1,
    11: -1,
    12: -1,
    13: -1.5,
  },
} as const;

export const bodyFont = createFont(fontConfig);

export const headingFont = bodyFont;

export const textVariants = {
  'display.lg': {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '8' as const,
    letterSpacing: -1.5,
  },
  'display.md': {
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '8' as const,
    letterSpacing: -1,
  },
  'display.sm': {
    fontSize: 9,
    lineHeight: 10,
    fontWeight: '7' as const,
    letterSpacing: -0.5,
  },

  'heading.lg': {
    fontSize: 9,
    lineHeight: 9,
    fontWeight: '6' as const,
    letterSpacing: -0.5,
  },
  'heading.md': {
    fontSize: 8,
    lineHeight: 8,
    fontWeight: '6' as const,
    letterSpacing: -0.25,
  },
  'heading.sm': {
    fontSize: 6,
    lineHeight: 6,
    fontWeight: '6' as const,
    letterSpacing: 0,
  },

  'body.lg': {
    fontSize: 6,
    lineHeight: 6,
    fontWeight: '1' as const,
    letterSpacing: 0,
  },
  'body.md': {
    fontSize: 4,
    lineHeight: 4,
    fontWeight: '1' as const,
    letterSpacing: 0,
  },
  'body.sm': {
    fontSize: 2,
    lineHeight: 2,
    fontWeight: '1' as const,
    letterSpacing: 0.1,
  },

  'label.md': {
    fontSize: 2,
    lineHeight: 2,
    fontWeight: '4' as const,
    letterSpacing: 0.5,
  },
  'label.sm': {
    fontSize: 1,
    lineHeight: 1,
    fontWeight: '4' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
} as const;

export type TextVariant = keyof typeof textVariants;
