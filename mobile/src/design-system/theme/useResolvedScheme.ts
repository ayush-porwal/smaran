// Resolves the active color scheme from (in order):
//   1. the manual override stored via ThemeProvider,
//   2. the device's useColorScheme() reading,
//   3. the static fallback 'light'.
//
// The Tamagui `<Theme name={...}>` wrapper further down the tree
// consumes this. Components don't call this hook directly; they consume
// tokens through Tamagui's automatic `useTheme()` (or our `useTheme`
// re-export, which is a thin wrapper).
import { useColorScheme } from 'react-native';
import { useContext } from 'react';

import { ThemePreferenceContext } from './ThemePreferenceContext';
import type { ColorScheme } from './types';

export function useResolvedScheme(): ColorScheme {
  const preference = useContext(ThemePreferenceContext);
  const system = useColorScheme();
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return system === 'dark' ? 'dark' : 'light';
}
