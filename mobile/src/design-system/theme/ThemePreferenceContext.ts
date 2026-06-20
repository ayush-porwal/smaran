import { createContext } from 'react';

import type { ThemePreference } from './types';

export const ThemePreferenceContext = createContext<ThemePreference>('system');
