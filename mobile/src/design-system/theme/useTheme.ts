// Re-exports Tamagui's useTheme so feature code has a single import
// path (`@/design-system`) for everything theme-related. Tamagui's
// useTheme returns the active theme's color tokens; combined with the
// `tokens` object exported from the config, it gives us both the
// semantic names (`theme.bgSurface`) and the raw palette (`tokens.color.indigo5`).
import { useTheme as tamaguiUseTheme } from 'tamagui';

export const useTheme = tamaguiUseTheme;
