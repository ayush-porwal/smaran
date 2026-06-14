// Sign-up screen. Mock accepts any email/password; the real flow will
// route to verify-email.tsx for code confirmation. We keep a simple
// form so the screen reads as a real sign-up page, not a stub.
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, View } from 'tamagui';

import {
  Box,
  Button,
  Heading,
  Pressable,
  Screen,
  Text,
  TextField,
  useToast,
} from '@/design-system';
import { ApiError, signUp } from '@/lib/api';

export default function SignUpScreen() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      toast.show({
        kind: 'error',
        message: 'Name, email, and a 6+ char password are required',
      });
      return;
    }
    setSubmitting(true);
    try {
      const { user } = await signUp({ name: name.trim(), email: email.trim(), password });
      // Real flow: redirect to verify-email; mock flow: skip straight in.
      toast.show({ kind: 'success', message: `Welcome, ${user.name}` });
      router.replace('/(app)' as never);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Sign up failed';
      toast.show({ kind: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  const isValid = name.trim().length > 0 && email.includes('@') && password.length >= 6;

  return (
    <Screen keyboardAvoid>
      <YStack flex={1} gap="$6" paddingTop="$8">
        <YStack gap="$2">
          <Heading level={1}>Create account</Heading>
          <Text variant="body.md" color="$textSecondary">
            You'll join groups and start sharing lists right away.
          </Text>
        </YStack>

        <YStack gap="$4">
          <TextField
            id="name"
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
          />
          <TextField
            id="email"
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TextField
            id="password"
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />
        </YStack>

        <Button
          variant="filled"
          onPress={onSubmit}
          disabled={!isValid}
          loading={submitting}
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <Box height={1} backgroundColor="$borderDefault" />

        <Pressable onPress={() => router.back()}>
          <View paddingVertical="$2" alignItems="center">
            <Text variant="label.md" color="$textSecondary">
              Back to sign in
            </Text>
          </View>
        </Pressable>
      </YStack>
    </Screen>
  );
}
