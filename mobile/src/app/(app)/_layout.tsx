// Tab navigator for the (app) group. Two tabs: "Lists" (groups home)
// and "Settings". Stack screens live alongside (`groups/[id]`,
// `lists/[id]`) but aren't shown in the tab bar.
import { Tabs } from 'expo-router';
import { House, Gear } from 'phosphor-react-native';

import { Text } from '@/design-system';

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5B5FE9',
        tabBarInactiveTintColor: '#71717A',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E4E4E7',
          borderTopWidth: 1,
        },
        tabBarLabel: ({ color, focused }) => (
          <Text
            variant="label.sm"
            color={color}
            // Active tab gets bold weight via the focused flag.
            fontWeight={focused ? '6' : '4'}
          >
            {focused ? 'Lists' : 'Settings'}
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
