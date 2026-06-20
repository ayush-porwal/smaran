/** Provider nesting order matters. KeyboardProvider before themed descendants — RN's built-in KAV is wrong on Android edge-to-edge. */
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
