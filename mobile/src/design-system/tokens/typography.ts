// Inter is the only typeface. We use @tamagui/font-inter which ships
// the OTF files and CSS; the babel plugin extracts the @font-face
// declarations and Metro bundles the font payloads. createInterFont
// returns a Tamagui font object — we override the default sizes,
// lineHeights, weights, and letter-spacings to match the spec's
// section 4.2 type scale.
import { createInterFont } from '@tamagui/font-inter';

export const bodyFont = createInterFont({
  family: 'Inter',
  // Size tokens mirror the spec's pixel scale. Tamagui sizes double as
  // an indexable scale (size.$4), so a 13 -> 4 mapping is intentional.
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
  // Line heights per spec. Each entry is keyed by size index.
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
  // Spec section 4.2 weight assignments. Tamagui's weight keys are
  // strings or numbers; we use numbers for compactness.
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
  // Spec section 4.2 letter spacings. Display sizes tighten; body stays
  // at 0; labels widen slightly.
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
});

// Same family for headings; tokens stay shared.
export const headingFont = bodyFont;

// Spec section 4.2 text variants. `<Text variant="body.md" />` resolves
// to the size/weight/line-height/letter-spacing combo in one place.
// `fontWeight` is keyed against the `weight` index above.
export const textVariants = {
  // Display
  'display.lg': { fontSize: 13, lineHeight: 13, fontWeight: '8' as const, letterSpacing: -1.5 },
  'display.md': { fontSize: 11, lineHeight: 12, fontWeight: '8' as const, letterSpacing: -1 },

  // Headings
  'heading.lg': { fontSize: 9, lineHeight: 9, fontWeight: '6' as const, letterSpacing: -0.5 },
  'heading.md': { fontSize: 8, lineHeight: 8, fontWeight: '6' as const, letterSpacing: -0.25 },
  'heading.sm': { fontSize: 6, lineHeight: 6, fontWeight: '6' as const, letterSpacing: 0 },

  // Body
  'body.lg': { fontSize: 6, lineHeight: 6, fontWeight: '1' as const, letterSpacing: 0 },
  'body.md': { fontSize: 4, lineHeight: 4, fontWeight: '1' as const, letterSpacing: 0 },
  'body.sm': { fontSize: 2, lineHeight: 2, fontWeight: '1' as const, letterSpacing: 0.1 },

  // Labels
  'label.md': { fontSize: 2, lineHeight: 2, fontWeight: '4' as const, letterSpacing: 0.5 },
  'label.sm': { fontSize: 1, lineHeight: 1, fontWeight: '4' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
} as const;

export type TextVariant = keyof typeof textVariants;
