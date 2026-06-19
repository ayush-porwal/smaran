// Group detail. Shows the group's metadata, the list of members with
// avatars, and the lists inside the group. Tapping a list navigates
// to the list detail. The header has a back button and a "+" button
// for creating a new list.
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeftIcon,
  CaretRightIcon,
  PlusIcon,
  UserPlusIcon,
} from "phosphor-react-native";
import { ScrollView, YStack, View } from "tamagui";

import {
  AvatarStack,
  Button,
  EmptyState,
  ErrorState,
  Heading,
  Icon,
  ListItem,
  Pressable,
  Screen,
  Stack,
  Text,
  useToast,
} from "@/design-system";
import {
  ApiError,
  getGroup,
  listsInGroup,
  listGroupMembers,
  type GroupWithMeta,
  type List,
} from "@/lib/api";
import { useStoreVersion } from "@/lib/api/useStoreVersion";
import { bumpVersion } from "@/lib/api/session";
import { useCurrentUser } from "@/lib/api/useCurrentUser";
import { CreateListModal } from "@/components/CreateListModal";
import { InviteModal } from "@/components/InviteModal";
import { MembersModal } from "@/components/MembersModal";

const EMOJIS = ["🛒", "📋", "🧳", "🍽️", "📝", "📚", "🎬", "🎁", "✈️", "🍳"];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();
  const groupVersion = useStoreVersion(`group:${id ?? ""}`);

  const [group, setGroup] = useState<GroupWithMeta | null>(null);
  const [lists, setLists] = useState<List[] | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  // Bumped after a role change / removal so the group + member list refetch.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    // Reset the error before each refetch (same rationale as
    // `(app)/index.tsx`).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    Promise.all([getGroup(id), listsInGroup(id), listGroupMembers(id)])
      .then(([g, l, m]) => {
        if (cancelled) return;
        setGroup(g);
        setLists(l);
        setMembers(
          m.map((mem) => ({
            id: mem.userId,
            name: mem.user.name || mem.user.email || "Member",
          })),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Failed to load group",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id, groupVersion, reloadKey]);

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => setError(null)} />
      </Screen>
    );
  }

  if (!group || !lists) {
    return (
      <Screen>
        <Stack.Vertical gap="$2">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              height={64}
              backgroundColor="$bgSubtle"
              borderRadius="$md"
              opacity={0.6}
            />
          ))}
        </Stack.Vertical>
      </Screen>
    );
  }

  // Trust the role the backend returns. (We deliberately do NOT fall back
  // to `createdBy === user.id`: a creator who's been demoted by another
  // admin correctly comes back as `member`, and showing them admin-only
  // controls would just make every admin mutation fail server-side.)
  const isAdmin = group.role === "admin";

  return (
    <Screen>
      <YStack flex={1} gap="$6">
        <Stack.Horizontal alignItems="center" justifyContent="space-between">
          <Pressable onPress={() => router.back()} accessibilityLabel="Back">
            <View
              width={40}
              height={40}
              alignItems="center"
              justifyContent="center"
              borderRadius="$full"
            >
              <ArrowLeftIcon size={22} weight="regular" color="$textPrimary" />
            </View>
          </Pressable>
          <View width={40} height={40} />
        </Stack.Horizontal>

        <YStack gap="$3">
          <View flexDirection="row" alignItems="center" gap="$3">
            <View
              width={56}
              height={56}
              borderRadius="$lg"
              backgroundColor="$bgSubtle"
              borderColor="$borderDefault"
              borderWidth={1}
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={28}>{group.emoji}</Text>
            </View>
            <YStack flex={1}>
              <Heading level={1}>{group.name}</Heading>
              <Text variant="body.sm" color="$textSecondary" marginTop="$1">
                {isAdmin ? "You administer this group" : "Joined as member"}
              </Text>
            </YStack>
          </View>

          {/* Tap to view the roster and (for admins) manage roles. */}
          <Pressable
            onPress={() => setMembersOpen(true)}
            accessibilityLabel="View members"
            accessibilityRole="button"
          >
            <Stack.Horizontal alignItems="center" gap="$3" marginTop="$2">
              <AvatarStack members={members} max={4} size={32} />
              <YStack flex={1}>
                <Text variant="body.md" color="$textPrimary" fontWeight="500">
                  {members
                    .slice(0, 2)
                    .map((m) => m.name.split(" ")[0])
                    .join(", ")}
                  {members.length > 2
                    ? ` + ${members.length - 2} ${members.length - 2 === 1 ? "other" : "others"}`
                    : ""}
                </Text>
                <Text variant="body.sm" color="$textTertiary">
                  {group.memberCount}{" "}
                  {group.memberCount === 1 ? "member" : "members"} in this group
                </Text>
              </YStack>
              <CaretRightIcon size={18} weight="bold" color="$textTertiary" />
            </Stack.Horizontal>
          </Pressable>

          {/* Prominent, labelled invite entry point. Admin-only — the
              backend authorises invites on the admin role. */}
          {isAdmin ? (
            <Button fullWidth onPress={() => setInviteOpen(true)}>
              <Stack.Horizontal alignItems="center" justifyContent="center" gap="$2">
                <Icon icon={UserPlusIcon} tone="accentText" size={18} weight="bold" />
                <Text color="#FFFFFF" fontWeight="600" fontSize="$5">
                  Invite people
                </Text>
              </Stack.Horizontal>
            </Button>
          ) : null}
        </YStack>

        {lists.length === 0 ? (
          <EmptyState
            icon={<PlusIcon size={32} weight="regular" />}
            title="No lists yet"
            description="Make your first list in this group."
            actionLabel="New list"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {lists.map((l) => (
                <ListItem
                  key={l.id}
                  leading={
                    <View
                      width={44}
                      height={44}
                      borderRadius="$lg"
                      backgroundColor="$bgSubtle"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize={22}>{l.emoji}</Text>
                    </View>
                  }
                  title={l.name}
                  description={`Updated ${formatRelative(l.updatedAt)}`}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/lists/[id]",
                      params: { id: l.id },
                    } as never)
                  }
                />
              ))}
            </YStack>
          </ScrollView>
        )}
      </YStack>

      {/* Floating action button — sits above the bottom safe area on
          top of the list scroll. The empty state already has its own
          "New list" CTA, so we hide the FAB when there's nothing to
          add a list to. */}
      {lists.length > 0 ? (
        <View
          position="absolute"
          right="$5"
          bottom="$5"
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.18}
          shadowRadius={10}
        >
          <Pressable
            onPress={() => setCreateOpen(true)}
            accessibilityLabel="New list"
            hitSlop={8}
          >
            <View
              width={56}
              height={56}
              borderRadius="$full"
              backgroundColor="$accent"
              alignItems="center"
              justifyContent="center"
            >
              <Icon icon={PlusIcon} tone="accentText" size={24} weight="bold" />
            </View>
          </Pressable>
        </View>
      ) : null}

      <CreateListModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        groupId={group.id}
        emojis={EMOJIS}
        onCreated={(listId) => {
          setCreateOpen(false);
          router.push({
            pathname: "/(app)/lists/[id]",
            params: { id: listId },
          } as never);
        }}
      />

      <InviteModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        groupId={group.id}
        groupName={group.name}
      />

      <MembersModal
        open={membersOpen}
        onOpenChange={setMembersOpen}
        groupId={group.id}
        groupName={group.name}
        currentUserId={user?.id ?? ""}
        isAdmin={isAdmin}
        onMembersChanged={() => setReloadKey((k) => k + 1)}
        onLeftGroup={() => {
          // The group is gone from this user's list (left or deleted);
          // invalidate the home groups list, then go back to it.
          bumpVersion("group:any");
          router.back();
        }}
      />
    </Screen>
  );
}

// Best-effort relative timestamp. Real app would use a date library.
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}
