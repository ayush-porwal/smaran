// Tamagui v2 expects `$`-prefixed space/size keys (e.g. `$4`).
export const space = {
  $0: 0,
  $1: 4,
  $2: 8,
  $3: 12,
  $4: 16,
  $5: 20,
  $6: 24,
  $7: 28,
  $8: 32,
  $9: 36,
  $10: 40,
  $11: 44,
  $12: 48,
  $14: 56,
  $16: 64,
  $20: 80,
  $24: 96,
  // Tamagui uses `$true` as the default reference for size-up/size-down
  // utilities. We point it at $4 (16) — the body/UI baseline.
  $true: 16,
} as const;

export type SpaceToken = keyof typeof space;

// Named rhythm for Screen padding and section gaps (16/12/24).
export const rhythm = {
  screenPadding: space.$4, // 16
  itemGap: space.$3, // 12
  sectionGap: space.$6, // 24
} as const;
