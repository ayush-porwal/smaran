// Tab navigator for the (app) group. Two tabs: "Lists" (groups home)
// and "Settings". Stack screens live alongside (`groups/[id]`,
// `lists/[id]`) but aren't shown in the tab bar. The tab bar is
// hidden whenever one of those detail screens is focused so the
// composer / members row sit flush against the bottom inset.
import { Tabs } from 'expo-router';
import { House, Gear } from 'phosphor-react-native';

import { Text, useResolvedScheme, themes } from '@/design-system';

const HIDE_TAB_BAR_ROUTES = new Set(['groups/[id]', 'lists/[id]']);

const HIDDEN_TAB_BAR_STYLE = {
  position: 'absolute' as const,
  bottom: 0,
  left: 0,
  right: 0,
  height: 0,
  paddingBottom: 0,
  borderTopWidth: 0,
  overflow: 'hidden' as const,
};

export default function AppTabsLayout() {
  const scheme = useResolvedScheme();
  const t = themes[scheme];

  return (
    <Tabs
      screenOptions={({ route }) => {
        // The Tabs route's state contains all child routes. The
        // focused child is at `state.routes[state.index]`. When it's
        // one of the detail screens, collapse the tab bar so the
        // composer's bottom padding is the last thing above the
        // system home indicator.
        const state = (
          route as unknown as { state?: { index: number; routes: { name: string }[] } }
        ).state;
        const focused = state?.routes?.[state?.index]?.name;
        const hideTabBar =
          focused !== undefined && HIDE_TAB_BAR_ROUTES.has(focused);

        return {
          headerShown: false,
          tabBarActiveTintColor: t.accent,
          tabBarInactiveTintColor: t.textTertiary,
          tabBarStyle: hideTabBar
            ? HIDDEN_TAB_BAR_STYLE
            : {
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
        };
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
