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
