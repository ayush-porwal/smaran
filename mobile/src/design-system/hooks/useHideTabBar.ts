// Group/list detail screens set `tabBarStyle` on their own options —
// not the parent Tabs navigator — to hide the tab bar while focused.
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback } from 'react';

type TabBarStyle = {
  display?: 'none' | 'flex';
  height?: number;
  opacity?: number;
};

export function useHideTabBar() {
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      const nav = navigation as unknown as {
        setOptions: (o: object) => void;
        getOptions?: () => { tabBarStyle?: TabBarStyle };
      };
      const original: TabBarStyle = nav.getOptions?.().tabBarStyle ?? {};
      const hidden: TabBarStyle = {
        ...original,
        display: 'none',
        height: 0,
        opacity: 0,
      };
      nav.setOptions({ tabBarStyle: hidden });
      return () => {
        nav.setOptions({ tabBarStyle: original });
      };
    }, [navigation]),
  );
}
