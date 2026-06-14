// Tab navigator for the (app) group. Two tabs: "Lists" (groups home)
// and "Settings". Stack screens live alongside (`groups/[id]`,
// `lists/[id]`) but aren't shown in the tab bar.
//
// The tab bar styling is theme-aware: we read the resolved scheme via
// `useResolvedScheme()` and look up the active theme's colors from
// the design-system `themes` map. Hardcoding hex values here would
// leave the tab bar in a different scheme than the screens above it
// (the bug we hit on the Settings screen in dark mode).
import { Tabs } from 'expo-router';
import { House, Gear } from 'phosphor-react-native';

import { Text, useResolvedScheme, themes } from '@/design-system';

export default function AppTabsLayout() {
  const scheme = useResolvedScheme();
  const t = themes[scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textTertiary,
        tabBarStyle: {
          backgroundColor: t.bgSurface,
          borderTopColor: t.borderDefault,
          borderTopWidth: 1,
        },
        tabBarLabel: ({ color, focused, children }) => (
          <Text
            variant="label.sm"
            color={color}
            fontWeight={focused ? '6' : '4'}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color, focused }) => (
            <House size={22} weight={focused ? 'fill' : 'regular'} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Gear size={22} weight={focused ? 'fill' : 'regular'} color={color as string} />
          ),
        }}
      />
      {/* Hidden stack screens: present in the route table but not in the tab bar. */}
      <Tabs.Screen name="groups/[id]" options={{ href: null }} />
      <Tabs.Screen name="lists/[id]" options={{ href: null }} />
    </Tabs>
  );
}
