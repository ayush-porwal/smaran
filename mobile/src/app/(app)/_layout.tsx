// Tab navigator for the (app) group. Two tabs: "Lists" (groups home)
// and "Settings". Stack screens live alongside (`groups/[id]`,
// `lists/[id]`) but aren't shown in the tab bar (`href: null`); the
// tab bar itself stays visible on them so navigation is always
// reachable. Screens with a bottom composer rely on keyboard-controller
// (see Screen's `keyboardAvoid`) to lift content above the keyboard,
// which detects the tab bar's offset on its own.
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
        tabBarLabel: ({ color, focused: tabFocused, children }) => (
          <Text
            variant="label.sm"
            color={color}
            fontWeight={tabFocused ? '6' : '4'}
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
