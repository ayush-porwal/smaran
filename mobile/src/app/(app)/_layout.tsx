import { Tabs } from 'expo-router';
import { HouseIcon, GearIcon } from 'phosphor-react-native';

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
          <Text variant="body.sm" color={color} fontWeight={tabFocused ? '600' : '400'}>
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
            <HouseIcon size={22} weight={focused ? 'fill' : 'regular'} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <GearIcon size={22} weight={focused ? 'fill' : 'regular'} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen name="groups/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="lists/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
