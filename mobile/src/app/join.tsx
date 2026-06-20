/** Invite deep link (smaran://join?g=&t=). Top-level route so it works signed in or out; sign-in resumes via pendingInvite. */
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Heading, Screen, Stack, Text } from '@/design-system';
import { ApiError, joinGroupViaLink } from '@/lib/api';
import { bumpVersion } from '@/lib/api/session';
import { useCurrentUser } from '@/lib/api/useCurrentUser';
import { savePendingInvite } from '@/lib/pendingInvite';

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function JoinScreen() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const params = useLocalSearchParams<{ g?: string | string[]; t?: string | string[] }>();
  const groupId = first(params.g);
  const token = first(params.t);

  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const incomplete = !loading && (!groupId || !token);

  useEffect(() => {
    if (loading || !groupId || !token) return;
    if (!user) {
      void savePendingInvite({ groupId, token });
      return;
    }
    if (started.current) return;
    started.current = true;
    joinGroupViaLink(groupId, token)
      .then((group) => {
        bumpVersion('group:any');
        router.replace({
          pathname: '/(app)/groups/[id]',
          params: { id: group.id },
        } as never);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Couldn't join the group.");
      });
  }, [loading, user, groupId, token, router]);

  if (!loading && !user && groupId && token) {
    return <Redirect href={'/(auth)/sign-in' as never} />;
  }

  if (error || incomplete) {
    return (
      <Screen>
        <Stack.Vertical flex={1} alignItems="center" justifyContent="center" gap="$4">
          <Heading level={2}>Couldn&apos;t open invite</Heading>
          <Text variant="body.md" color="$textSecondary" textAlign="center">
            {error ?? 'This invite link is incomplete.'}
          </Text>
          <Button onPress={() => router.replace('/(app)' as never)}>Go to my groups</Button>
        </Stack.Vertical>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Vertical flex={1} alignItems="center" justifyContent="center" gap="$3">
        <ActivityIndicator />
        <Text variant="body.md" color="$textTertiary" textAlign="center">
          Joining the group…
        </Text>
      </Stack.Vertical>
    </Screen>
  );
}
