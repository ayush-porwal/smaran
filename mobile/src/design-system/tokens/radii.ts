// Tamagui radius tokens use plain keys (sm, md, …), not `$`-prefixed names.
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
