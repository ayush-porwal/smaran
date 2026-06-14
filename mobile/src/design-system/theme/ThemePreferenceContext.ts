// Context that holds the user's theme override. The default value of
// `'system'` means follow the device. The provider (in
// ThemeProvider.tsx) reads the persisted preference from storage on
// mount and exposes a setter for the settings screen.
import { createContext } from 'react';

import type { ThemePreference } from './types';

export const ThemePreferenceContext = createContext<ThemePreference>('system');
