// Modal for inviting people to a group via a shareable link. On open it
// creates (or reuses) the group's invite link and shows it; "Share link"
// opens the native share sheet so the admin can send it through any app.
// Anyone who opens the link and signs in joins the group — there's no
// email delivery (see app/join.tsx for the receiving side).
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Share } from "react-native";
import { View, YStack } from "tamagui";

import { Button, Modal, Text } from "@/design-system";
import { ApiError, createGroupInviteLink } from "@/lib/api";
import { buildInviteUrl } from "@/lib/inviteLink";

type InviteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
};

type LinkState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; url: string };

export function InviteModal({ open, onOpenChange, groupId, groupName }: InviteModalProps) {
  const [state, setState] = useState<LinkState>({ status: "loading" });

  const generate = useCallback(() => {
    setState({ status: "loading" });
    return createGroupInviteLink(groupId)
      .then((l) => setState({ status: "ready", url: buildInviteUrl(l.groupId, l.token) }))
      .catch((err) =>
        setState({
          status: "error",
          message: err instanceof ApiError ? err.message : "Couldn't create an invite link",
        }),
      );
  }, [groupId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });
    createGroupInviteLink(groupId)
      .then((l) => {
        if (!cancelled) setState({ status: "ready", url: buildInviteUrl(l.groupId, l.token) });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof ApiError ? err.message : "Couldn't create an invite link",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [open, groupId]);

  async function onShare() {
    if (state.status !== "ready") return;
    try {
      await Share.share({ message: `Join "${groupName}" on Smaran: ${state.url}` });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Invite to group"
      description="Anyone with this link can join. It works for 30 days."
      primaryAction={{
        label: state.status === "loading" ? "Creating link…" : "Share link",
        onPress: onShare,
        loading: state.status === "loading",
      }}
      secondaryAction={{ label: "Done", onPress: () => onOpenChange(false) }}
    >
      <YStack gap="$3" minHeight={72} justifyContent="center">
        {state.status === "loading" ? (
          <ActivityIndicator />
        ) : state.status === "error" ? (
          <YStack gap="$3">
            <Text variant="body.sm" color="$danger" textAlign="center">
              {state.message}
            </Text>
            <Button size="sm" variant="ghost" tone="textPrimary" onPress={() => void generate()}>
              Try again
            </Button>
          </YStack>
        ) : (
          <View
            borderWidth={1}
            borderColor="$borderDefault"
            borderRadius="$md"
            backgroundColor="$bgSubtle"
            paddingVertical="$3"
            paddingHorizontal="$3"
          >
            <Text variant="body.sm" color="$textSecondary" selectable>
              {state.url}
            </Text>
          </View>
        )}
      </YStack>
    </Modal>
  );
}
