// Group detail. Shows the group's metadata, the list of members with
// avatars, and the lists inside the group. Tapping a list navigates
// to the list detail. The header has a back button and a "+" button
// for creating a new list.
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Users } from 'phosphor-react-native';
import { ScrollView, YStack, View } from 'tamagui';

import {
  AvatarStack,
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
} from '@/design-system';
import {
  ApiError,
  createList,
  getGroup,
  listsInGroup,
  listGroupMembers,
  type GroupWithMeta,
  type List,
} from '@/lib/api';
import { useStoreVersion } from '@/lib/api/useStoreVersion';
import { useCurrentUser } from '@/lib/api/useCurrentUser';
import { CreateListModal } from '@/components/CreateListModal';

const EMOJIS = ['🛒', '📋', '🧳', '🍽️', '📝', '📚', '🎬', '🎁', '✈️', '🍳'];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();
  const groupVersion = useStoreVersion(`group:${id ?? ''}`);

  const [group, setGroup] = useState<GroupWithMeta | null>(null);
  const [lists, setLists] = useState<List[] | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    Promise.all([getGroup(id), listsInGroup(id), listGroupMembers(id)])
      .then(([g, l, m]) => {
        if (cancelled) return;
        setGroup(g);
        setLists(l);
        setMembers(m.map((mem) => ({ id: mem.userId, name: mem.user.name })));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load group');
      });
    return () => {
      cancelled = true;
    };
  }, [id, groupVersion]);

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
            <View key={i} height={64} backgroundColor="$bgSubtle" borderRadius="$md" opacity={0.6} />
          ))}
        </Stack.Vertical>
      </Screen>
    );
  }

  const myRole = group.role; // 'admin' | 'member'

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
              <ArrowLeft size={22} weight="regular" color="$textPrimary" />
            </View>
          </Pressable>
          <Pressable onPress={() => setCreateOpen(true)} accessibilityLabel="New list">
            <View
              width={40}
              height={40}
              borderRadius="$full"
              backgroundColor="$accent"
              alignItems="center"
              justifyContent="center"
            >
              <Icon icon={Plus} tone="accentText" size={20} weight="bold" />
            </View>
          </Pressable>
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
                {myRole === 'admin' ? 'You administer this group' : 'Joined as member'}
              </Text>
            </YStack>
          </View>

          <Stack.Horizontal alignItems="center" gap="$3" marginTop="$1">
            <Icon icon={Users} tone="textTertiary" size={16} weight="regular" />
            <AvatarStack members={members} max={4} size={24} />
            <Text variant="body.sm" color="$textTertiary">
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </Stack.Horizontal>
        </YStack>

        {lists.length === 0 ? (
          <EmptyState
            icon={<Plus size={32} weight="regular" />}
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
                  onPress={() => router.push({ pathname: '/(app)/lists/[id]', params: { id: l.id } } as never)}
                />
              ))}
            </YStack>
          </ScrollView>
        )}
      </YStack>

      <CreateListModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        groupId={group.id}
        emojis={EMOJIS}
        onCreated={(listId) => {
          setCreateOpen(false);
          router.push({ pathname: '/(app)/lists/[id]', params: { id: listId } } as never);
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
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}
