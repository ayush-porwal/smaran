// Renders nothing when empty. Invites matched by email on the backend.
import { useCallback, useEffect, useState } from 'react';
import { View, YStack } from 'tamagui';

import { Button, Heading, Stack, Text, useToast } from '@/design-system';
import { ApiError, acceptInvite, listPendingInvites, type Invite } from '@/lib/api';

type PendingInvitesProps = {
  onAccepted?: (groupId: string) => void;
};

export function PendingInvites({ onAccepted }: PendingInvitesProps) {
  const toast = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const load = useCallback(() => {
    listPendingInvites()
      .then(setInvites)
      // Hide the banner on fetch failure — invites are a secondary surface.
      .catch(() => setInvites([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onAccept(invite: Invite) {
    setAcceptingId(invite.id);
    try {
      const group = await acceptInvite(invite.id);
      toast.show({ kind: 'success', message: `Joined ${group.name}` });
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      onAccepted?.(group.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not accept invite';
      toast.show({ kind: 'error', message });
    } finally {
      setAcceptingId(null);
    }
  }

  if (invites.length === 0) return null;

  return (
    <YStack gap="$3">
      <Heading level={3}>Invitations</Heading>
      <Stack.Vertical gap="$2">
        {invites.map((invite) => (
          <View
            key={invite.id}
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            borderRadius="$lg"
            borderWidth={1}
            borderColor="$borderDefault"
            backgroundColor="$bgSurface"
          >
            <View
              width={44}
              height={44}
              borderRadius="$lg"
              backgroundColor="$bgSubtle"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={22}>{invite.group?.emoji ?? '✉️'}</Text>
            </View>
            <YStack flex={1}>
              <Text variant="body.md" color="$textPrimary" fontWeight="500">
                {invite.group?.name ?? 'A group'}
              </Text>
              <Text variant="body.sm" color="$textTertiary">
                You&apos;ve been invited to join
              </Text>
            </YStack>
            <Button size="sm" onPress={() => onAccept(invite)} loading={acceptingId === invite.id}>
              Accept
            </Button>
          </View>
        ))}
      </Stack.Vertical>
    </YStack>
  );
}
