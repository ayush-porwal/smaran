// Root layout. Order of providers matters:
//
//   1. GestureHandlerRootView — required by react-native-gesture-handler
//      for any Reanimated/gesture-driven work to mount.
//   2. SafeAreaProvider — gives descendants access to safe-area insets.
//   3. TamaguiProvider — supplies the theme + token config to the tree.
//   4. ThemeProvider — loads the persisted preference, resolves the
//      effective scheme, and renders <Theme name={...}>. Children only
//      see a Theme-resolved tree, so `useTheme()` returns the right values.
//   5. ToastProvider — mounts the global toast renderer. Sits inside
//      the theme so toast colors are themed.
//
// Global CSS: on web, loads Inter from Google Fonts and sets a sane
// body font-family. On native the file is a no-op. See the file for
// why we don't go through @tamagui/font-inter's bundled OTF on web.
import '@/global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';

import { ThemeProvider, ToastProvider, tamaguiConfig } from '@/design-system';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <ThemeProvider>
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </ToastProvider>
          </ThemeProvider>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
