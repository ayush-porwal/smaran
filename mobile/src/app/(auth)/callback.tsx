// OAuth callback. expo-auth-session / WebBrowser's `openAuthSessionAsync`
// handles the redirect for us; this screen only exists so the
// `smaran://callback` deep link has a route to land on when the OS
// re-opens the app. We immediately redirect into the (app) tabs.
import { useEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { Screen, Text } from '@/design-system';
import { useCurrentUser } from '@/lib/api/useCurrentUser';

export default function CallbackScreen() {
  const { user, loading } = useCurrentUser();
  const params = useLocalSearchParams<{ code?: string; error?: string }>();

  useEffect(() => {
    // The auth flow itself exchanges the code (in `auth.ts`) and
    // stores the tokens before the redirect lands here. This
    // screen is a destination for the OS-level re-open.
    void params;
  }, [params]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator />
        <Text variant="body.md" color="$textTertiary" textAlign="center">
          Completing sign-in…
        </Text>
      </Screen>
    );
  }
  if (user) return <Redirect href={'/(app)' as never} />;
  return <Redirect href={'/(auth)/sign-in' as never} />;
}
