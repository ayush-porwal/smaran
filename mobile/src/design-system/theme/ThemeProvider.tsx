// ThemeProvider sits between TamaguiProvider and the screen tree. It:
//   1. Loads the persisted theme preference (light/dark/system) from
//      AsyncStorage on mount,
//   2. Exposes it via ThemePreferenceContext,
//   3. Resolves the effective scheme via useResolvedScheme and wraps
//      the tree in the matching Tamagui `<Theme name="..." />`.
//
// System color scheme is the default; the settings screen can override
// it via the `setPreference` callback returned from `useThemeControls`.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StatusBar } from 'expo-status-bar';
import { Theme } from 'tamagui';

import { ThemePreferenceContext } from './ThemePreferenceContext';
import { useResolvedScheme } from './useResolvedScheme';
import { THEME_PREFERENCE_KEY, type ThemePreference } from './types';

type ThemeControls = {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
};

const ThemeControlsContext = createContext<ThemeControls>({
  preference: 'system',
  setPreference: () => {},
});

export { ThemeControlsContext };

export function useThemeControls(): ThemeControls {
  return useContext(ThemeControlsContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(THEME_PREFERENCE_KEY, next);
  }, []);

  const controls = useMemo<ThemeControls>(
    () => ({ preference, setPreference }),
    [preference, setPreference],
  );

  return (
    <ThemePreferenceContext.Provider value={preference}>
      <ThemeControlsContext.Provider value={controls}>
        <ThemedContent hydrated={hydrated}>{children}</ThemedContent>
      </ThemeControlsContext.Provider>
    </ThemePreferenceContext.Provider>
  );
}

// Inner component subscribes to system + preference changes; rendered
// once hydration finishes so the first paint matches storage rather
// than the system's transient value.
function ThemedContent({
  children,
  hydrated,
}: {
  children: ReactNode;
  hydrated: boolean;
}) {
  const resolved = useResolvedScheme();
  // Block the first paint until storage has been read; otherwise the
  // user sees a brief flash of the wrong theme.
  if (!hydrated) return null;
  return (
    <Theme name={resolved}>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      {children}
    </Theme>
  );
}
