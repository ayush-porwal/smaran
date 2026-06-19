// Root layout. Order of providers matters:
//
//   1. GestureHandlerRootView — required by react-native-gesture-handler
//      for any Reanimated/gesture-driven work to mount.
//   2. KeyboardProvider — mounts the react-native-keyboard-controller
//      native module so descendants can use its KeyboardAvoidingView /
//      hooks for smooth, keyboard-frame-tracked avoidance (correct on
//      Android edge-to-edge, which RN's built-in KAV is not).
//   3. SafeAreaProvider — gives descendants access to safe-area insets.
//   4. TamaguiProvider — supplies the theme + token config to the tree.
//   5. ThemeProvider — loads the persisted preference, resolves the
//      effective scheme, and renders <Theme name={...}>. Children only
//      see a Theme-resolved tree, so `useTheme()` returns the right values.
//   6. ToastProvider — mounts the global toast renderer. Sits inside
//      the theme so toast colors are themed.
//
// Typography uses the platform system font — no custom font loading.
import "@/global.css";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { TamaguiProvider } from "tamagui";

import { ThemeProvider, ToastProvider, tamaguiConfig } from "@/design-system";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
            <ThemeProvider>
              <ToastProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </ToastProvider>
            </ThemeProvider>
          </TamaguiProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
