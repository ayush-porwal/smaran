// Border radius scale. Spec section 6. Tamagui's default radius tokens
// use plain numeric keys (0, 1, 2, …, true, 12); we override with
// semantic names that match the design spec verbatim.
export const radius = {
  0: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
