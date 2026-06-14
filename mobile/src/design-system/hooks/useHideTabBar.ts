// Hides the parent tab navigator's bar while this screen is focused.
// The detail screens (group detail, list detail) are Stack screens
// pushed on top of the (app) Tabs; without this hook the tab bar
// stays visible underneath, leaving an empty strip between the
// composer and the system bottom inset.
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback } from 'react';

type TabBarStyle = { display?: 'none' | 'flex' };

export function useHideTabBar() {
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      // Walk up to the parent tab navigator and toggle its tab bar
      // style. `getParent()` is on the runtime object even if it's
      // not in the TS types here.
      const parent = (navigation as unknown as { getParent?: () => unknown }).getParent?.();
      if (!parent) return;
      const typed = parent as {
        setOptions: (o: object) => void;
        getOptions?: () => { tabBarStyle?: TabBarStyle };
      };
      const original: TabBarStyle = typed.getOptions?.().tabBarStyle ?? {};
      typed.setOptions({
        tabBarStyle: { ...original, display: 'none' },
      });
      return () => {
        typed.setOptions({ tabBarStyle: original });
      };
    }, [navigation])
  );
}
