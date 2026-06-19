// A banner of outstanding group invitations addressed to the signed-in
// user (matched by their email on the backend). Renders nothing when
// there are none, so the groups screen is unchanged for users without
// invites. Accepting adds the user to the group and asks the parent to
// refetch its group list, since they're now a member of a new one.
import { useCallback, useEffect, useState } from "react";
import { View, YStack } from "tamagui";

import { Button, Heading, Stack, Text, useToast } from "@/design-system";
import {
  ApiError,
  acceptInvite,
  listPendingInvites,
  type Invite,
} from "@/lib/api";

type PendingInvitesProps = {
  // Called after an invite is accepted so the parent can refetch the
  // user's groups. `groupId` is the group they just joined.
  onAccepted?: (groupId: string) => void;
};

export function PendingInvites({ onAccepted }: PendingInvitesProps) {
  const toast = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const load = useCallback(() => {
    listPendingInvites()
      .then(setInvites)
      // Invites are a secondary surface; if the fetch fails we just hide
      // the banner rather than blocking the groups screen with an error.
      .catch(() => setInvites([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onAccept(invite: Invite) {
    setAcceptingId(invite.id);
    try {
      const group = await acceptInvite(invite.id);
      toast.show({ kind: "success", message: `Joined ${group.name}` });
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      onAccepted?.(group.id);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not accept invite";
      toast.show({ kind: "error", message });
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
              <Text fontSize={22}>{invite.group?.emoji ?? "✉️"}</Text>
            </View>
            <YStack flex={1}>
              <Text variant="body.md" color="$textPrimary" fontWeight="500">
                {invite.group?.name ?? "A group"}
              </Text>
              <Text variant="body.sm" color="$textTertiary">
                You&apos;ve been invited to join
              </Text>
            </YStack>
            <Button
              size="sm"
              onPress={() => onAccept(invite)}
              loading={acceptingId === invite.id}
            >
              Accept
            </Button>
          </View>
        ))}
      </Stack.Vertical>
    </YStack>
  );
}
