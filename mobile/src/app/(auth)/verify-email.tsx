// Verify-email screen. Stub for the real Cognito confirmation flow.
// In the mock we skip verification, so this screen is mostly a
// "Continue" button that routes into the (app) tabs.
import { useRouter } from 'expo-router';
import { YStack, View } from 'tamagui';
import { Envelope } from 'phosphor-react-native';

import {
  Box,
  Heading,
  Pressable,
  Screen,
  Text,
} from '@/design-system';

export default function VerifyEmailScreen() {
  const router = useRouter();

  return (
    <Screen>
      <YStack flex={1} gap="$6" paddingTop="$8" alignItems="center" justifyContent="center">
        <Box
          width={80}
          height={80}
          borderRadius="$full"
          backgroundColor="$accentSubtle"
          alignItems="center"
          justifyContent="center"
        >
          <Envelope size={36} weight="regular" color="$accent" />
        </Box>

        <YStack gap="$2" alignItems="center" maxWidth={320}>
          <Heading level={2} textAlign="center">
            Check your email
          </Heading>
          <Text variant="body.md" color="$textSecondary" textAlign="center">
            We sent a confirmation code. Enter it in the app to finish setting up your account.
          </Text>
        </YStack>

        <Pressable onPress={() => router.replace('/(app)' as never)}>
          <Box
            backgroundColor="$accent"
            borderRadius="$md"
            paddingVertical="$4"
            paddingHorizontal="$6"
          >
            <Text variant="heading.sm" color="$textInverse">
              Continue
            </Text>
          </Box>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <View paddingVertical="$2">
            <Text variant="label.md" color="$textSecondary">
              Back
            </Text>
          </View>
        </Pressable>
      </YStack>
    </Screen>
  );
}
