// Theme-related types shared by the bridge layer (ThemeProvider, hooks).
// Kept separate from the tokens so we can change token shape without
// re-exporting everything that depends on it.

export type ColorScheme = 'light' | 'dark';

// Manual override stored in AsyncStorage. `'system'` means follow the
// device's `useColorScheme()` and the override is unset.
export type ThemePreference = ColorScheme | 'system';

export const THEME_PREFERENCE_KEY = 'smaran:theme-preference';
