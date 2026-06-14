// Sign-in screen. The only flow is "Continue with Google" — the
// app opens the Cognito hosted UI in the browser, the user signs
// in with Google, and the deep-link callback exchanges the code
// for tokens.
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { GoogleLogo } from 'phosphor-react-native';
import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Heading,
  Icon,
  Screen,
  Text,
  useToast,
} from '@/design-system';
import { signIn as cognitoSignIn } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { isConfigured } from '@/lib/config';

export default function SignInScreen() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const ready = isConfigured();

  async function onSignIn() {
    if (!ready) {
      toast.show({
        kind: 'error',
        message: 'App is not configured for this build. Run the deploy workflow first.',
      });
      return;
    }
    setSubmitting(true);
    try {
      await cognitoSignIn();
      router.replace('/(app)' as never);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Sign in failed';
      toast.show({ kind: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen keyboardAvoid>
      <YStack flex={1} gap="$6" paddingTop="$8" justifyContent="center">
        <YStack gap="$2" alignItems="center">
          <Box
            width={80}
            height={80}
            borderRadius="$full"
            backgroundColor="$accentSubtle"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={36}>✓</Text>
          </Box>
          <Heading level={1} textAlign="center">
            Smaran
          </Heading>
          <Text variant="body.md" color="$textSecondary" textAlign="center">
            Share lists with people you trust.
          </Text>
        </YStack>

        <YStack gap="$3" marginTop="$8">
          <Button
            variant="filled"
            onPress={onSignIn}
            loading={submitting}
            disabled={!ready}
          >
            <XStack alignItems="center" gap="$2">
              <Icon icon={GoogleLogo} tone="accentText" size={20} weight="regular" />
              <Text variant="label.md" color="$accentText" fontWeight="600">
                {submitting ? 'Opening Google…' : 'Continue with Google'}
              </Text>
            </XStack>
          </Button>
          {!ready ? (
            <Text variant="body.sm" color="$danger" textAlign="center">
              Missing build config. Re-run the deploy workflow.
            </Text>
          ) : null}
        </YStack>
      </YStack>
    </Screen>
  );
}
