// Groups list (the home tab). Shows every group the current user is a
// member of, with a member-count badge and a list-count badge. Tapping
// a group navigates to the group home. The "+" header button opens a
// create-group sheet (in Phase 0 it's a modal that captures name/emoji).
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Plus } from 'phosphor-react-native';
import { YStack, View } from 'tamagui';

import {
  EmptyState,
  ErrorState,
  Heading,
  ListItem,
  Pressable,
  Screen,
  Stack,
  Text,
  useToast,
} from '@/design-system';
import { listMyGroups, type GroupWithMeta, ApiError } from '@/lib/api';
import { useStoreVersion } from '@/lib/api/useStoreVersion';
import { useCurrentUser } from '@/lib/api/useCurrentUser';
import { CreateGroupModal } from '@/components/CreateGroupModal';

export default function GroupsHomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();
  const sessionVersion = useStoreVersion('session');
  const [groups, setGroups] = useState<GroupWithMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const groupVersion = useStoreVersion('group:any'); // bumped on any group mutation

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listMyGroups()
      .then((g) => {
        if (cancelled) return;
        setGroups(g);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : 'Failed to load groups';
        setError(message);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionVersion, groupVersion]);

  return (
    <Screen>
      <YStack flex={1} gap="$4">
        <YStack gap="$1">
          <Text variant="body.md" color="$textSecondary">
            {user ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome'}
          </Text>
          <YStack flexDirection="row" alignItems="center" justifyContent="space-between">
            <Heading level={1}>Your groups</Heading>
            <Pressable onPress={() => setCreateOpen(true)}>
              <View
                width={40}
                height={40}
                borderRadius="$full"
                backgroundColor="$accent"
                alignItems="center"
                justifyContent="center"
              >
                <Plus size={20} weight="bold" color="$textInverse" />
              </View>
            </Pressable>
          </YStack>
        </YStack>

        {error ? (
          <ErrorState
            message={error}
            onRetry={() => {
              setError(null);
              setGroups(null);
            }}
          />
        ) : groups === null ? (
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
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Plus size={32} weight="regular" />}
            title="No groups yet"
            description="Make your first group to start sharing lists with people."
            actionLabel="Create group"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <Stack.Vertical gap="$2">
            {groups.map((g) => (
              <ListItem
                key={g.id}
                leading={
                  <View
                    width={40}
                    height={40}
                    borderRadius="$md"
                    backgroundColor="$bgSubtle"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={20}>{g.emoji}</Text>
                  </View>
                }
                title={g.name}
                description={`${g.memberCount} ${g.memberCount === 1 ? 'member' : 'members'} · ${g.listCount} ${g.listCount === 1 ? 'list' : 'lists'}`}
                onPress={() => router.push({ pathname: '/(app)/groups/[id]', params: { id: g.id } } as never)}
              />
            ))}
          </Stack.Vertical>
        )}
      </YStack>

      <CreateGroupModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(groupId) => {
          setCreateOpen(false);
          router.push({ pathname: '/(app)/groups/[id]', params: { id: groupId } } as never);
        }}
      />
    </Screen>
  );
}
