export type ColorScheme = 'light' | 'dark';

// `'system'` follows the device; light/dark are persisted overrides.
export type ThemePreference = ColorScheme | 'system';

export const THEME_PREFERENCE_KEY = 'smaran:theme-preference';
