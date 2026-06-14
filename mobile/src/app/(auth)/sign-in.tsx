// Sign-in screen. In the mock, we surface the seeded users as a list
// and the user picks one to "sign in" as. The real flow (when the
// CDK stack lands) will replace this list with an email/password form
// wired to Cognito via the same `signIn` API.
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, YStack, View } from 'tamagui';

import {
  Box,
  Heading,
  ListItem,
  Pressable,
  Screen,
  Stack,
  Text,
  useToast,
} from '@/design-system';
import { ApiError, signIn, store } from '@/lib/api';

export default function SignInScreen() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Snapshot the seeded users at mount. In real life the form would
  // collect email/password, but for the mock we just enumerate.
  const users = [...store.users.values()];

  async function signInAs(userId: string) {
    setSubmitting(true);
    try {
      const user = store.users.get(userId);
      if (!user) throw new ApiError('not_found', 'User missing');
      await signIn({ email: user.email, password: 'mock' });
      toast.show({ kind: 'success', message: `Signed in as ${user.name}` });
      router.replace('/(app)' as never);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      toast.show({ kind: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <YStack flex={1} gap="$6" paddingTop="$8">
        <YStack gap="$2">
          <Heading level={1}>Sign in</Heading>
          <Text variant="body.md" color="$textSecondary">
            Pick a seeded user to sign in as. (Real auth ships with Phase 1.)
          </Text>
        </YStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$2">
            {users.map((u) => (
              <ListItem
                key={u.id}
                title={u.name}
                description={u.email}
                onPress={() => signInAs(u.id)}
                disabled={submitting}
              />
            ))}
          </YStack>
        </ScrollView>

        <Box height={1} backgroundColor="$borderDefault" />

        <YStack gap="$3" alignItems="center">
          <Text variant="body.sm" color="$textTertiary">
            Don't have an account?
          </Text>
          <Pressable onPress={() => router.push('/(auth)/sign-up' as never)}>
            <View paddingVertical="$2" paddingHorizontal="$4">
              <Text variant="label.md" color="$accent">
                Create one
              </Text>
            </View>
          </Pressable>
        </YStack>
      </YStack>
    </Screen>
  );
}
