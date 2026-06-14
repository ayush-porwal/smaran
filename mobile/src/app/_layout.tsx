import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';

import tamaguiConfig from '../../tamagui.config';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    // GestureHandlerRootView is required at the app root for any Reanimated/
    // gesture-handler driven components to work. The style is a no-op but
    // some platforms require the flex:1 to mount correctly.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          {/* System-follow theme for now; manual override is added once the
              ThemeProvider (with useResolvedScheme) lands in design-system. */}
          <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </Theme>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
