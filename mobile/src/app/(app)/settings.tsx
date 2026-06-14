// Settings tab. Theme picker, account info, sign out. The "Sign in
// with Google" button (when Cognito lands) will live here too.
import { useRouter } from 'expo-router';
import { YStack, XStack, View, Separator } from 'tamagui';
import { SignOut, UserCircle } from 'phosphor-react-native';

import {
  Heading,
  Pressable,
  Screen,
  Stack,
  Text,
  useThemeControls,
  useToast,
} from '@/design-system';
import { signOut, useCurrentUser } from '@/lib/api';

export default function SettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { preference, setPreference } = useThemeControls();
  const { user } = useCurrentUser();

  async function onSignOut() {
    try {
      await signOut();
      toast.show({ kind: 'info', message: 'Signed out' });
      router.replace({ pathname: '/(auth)/sign-in' } as never);
    } catch (err) {
      toast.show({ kind: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  }

  return (
    <Screen>
      <YStack flex={1} gap="$6">
        <Heading level={1}>Settings</Heading>

        <YStack gap="$2">
          <Text variant="label.sm" color="$textTertiary">
            Account
          </Text>
          <Stack.Horizontal
            backgroundColor="$bgSurface"
            borderColor="$borderDefault"
            borderWidth={1}
            borderRadius="$md"
            padding="$3"
            alignItems="center"
            gap="$3"
          >
            <View
              width={40}
              height={40}
              borderRadius="$full"
              backgroundColor="$bgSubtle"
              alignItems="center"
              justifyContent="center"
            >
              <UserCircle size={24} weight="regular" color="$textSecondary" />
            </View>
            <YStack flex={1}>
              <Text variant="heading.sm">{user?.name ?? 'Anonymous'}</Text>
              <Text variant="body.sm" color="$textSecondary">
                {user?.email ?? '—'}
              </Text>
            </YStack>
          </Stack.Horizontal>
        </YStack>

        <YStack gap="$2">
          <Text variant="label.sm" color="$textTertiary">
            Theme
          </Text>
          <YStack
            backgroundColor="$bgSurface"
            borderColor="$borderDefault"
            borderWidth={1}
            borderRadius="$md"
            overflow="hidden"
          >
            {(['light', 'dark', 'system'] as const).map((p, i) => (
              <Pressable
                key={p}
                onPress={() => setPreference(p)}
              >
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$3"
                  borderTopColor="$borderDefault"
                  borderTopWidth={i === 0 ? 0 : 0.5}
                >
                  <Text variant="body.md" textTransform="capitalize">
                    {p}
                  </Text>
                  {preference === p ? (
                    <Text variant="body.md" color="$accent">
                      ✓
                    </Text>
                  ) : null}
                </XStack>
              </Pressable>
            ))}
          </YStack>
        </YStack>

        <YStack gap="$2" marginTop="auto">
          <Pressable onPress={onSignOut}>
            <XStack
              backgroundColor="$bgSurface"
              borderColor="$borderDefault"
              borderWidth={1}
              borderRadius="$md"
              padding="$3"
              alignItems="center"
              justifyContent="center"
              gap="$2"
            >
              <SignOut size={18} weight="regular" color="$danger" />
              <Text variant="heading.sm" color="$danger">
                Sign out
              </Text>
            </XStack>
          </Pressable>
        </YStack>
      </YStack>
    </Screen>
  );
}
