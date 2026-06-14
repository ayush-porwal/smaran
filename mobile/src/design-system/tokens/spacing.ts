// 4px base spacing scale. Tamagui v2 expects size/space token keys to
// be prefixed with `$` (e.g. `$4`), so we name ours the same way the
// default config does. Using numbers (not t-shirt names) lets us
// reference the same scale from padding, gap, and margin props without
// translation.
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

// Screen-level rhythm tokens, used by primitives that need them directly
// (Screen padding, section gaps). Kept here so the spec's "16/12/24"
// rhythm has a named home and doesn't end up as a magic number.
export const rhythm = {
  screenPadding: space.$4, // 16
  itemGap: space.$3, // 12
  sectionGap: space.$6, // 24
} as const;
