/** Route target for smaran://callback. Token exchange runs in auth.ts before this screen mounts. */
import { useEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { Screen, Text } from '@/design-system';
import { useCurrentUser } from '@/lib/api/useCurrentUser';

export default function CallbackScreen() {
  const { user, loading } = useCurrentUser();
  const params = useLocalSearchParams<{ code?: string; error?: string }>();

  useEffect(() => {
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
