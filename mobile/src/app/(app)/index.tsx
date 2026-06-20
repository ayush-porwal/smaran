import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { PlusIcon } from 'phosphor-react-native';
import { YStack, View } from 'tamagui';

import {
  EmptyState,
  ErrorState,
  Heading,
  Icon,
  ListItem,
  Pressable,
  Screen,
  Stack,
  Text,
} from '@/design-system';
import { listMyGroups, type GroupWithMeta, ApiError } from '@/lib/api';
import { useStoreVersion } from '@/lib/api/useStoreVersion';
import { useCurrentUser } from '@/lib/api/useCurrentUser';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { PendingInvites } from '@/components/PendingInvites';

export default function GroupsHomeScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const sessionVersion = useStoreVersion('session');
  const [groups, setGroups] = useState<GroupWithMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const groupVersion = useStoreVersion('group:any');
  // Invite accept doesn't bump group:any — refetch so the new membership appears.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Reset the error before each refetch so a previous failure
    // doesn't linger while we load. The React 19 lint rule against
    // synchronous setState in an effect is overly strict here — the
    // alternative (resetting error only in the `onRetry` handler)
    // leaves stale errors on version-bump refetches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [sessionVersion, groupVersion, reloadKey]);

  return (
    <Screen>
      <YStack flex={1} gap="$6">
        <YStack gap="$2">
          <Text variant="label.sm" color="$textTertiary">
            {user ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome'}
          </Text>
          <YStack flexDirection="row" alignItems="center" justifyContent="space-between">
            <Heading level={1}>Your groups</Heading>
            <Pressable onPress={() => setCreateOpen(true)} accessibilityLabel="Create group">
              <View
                width={40}
                height={40}
                borderRadius="$full"
                backgroundColor="$accent"
                alignItems="center"
                justifyContent="center"
              >
                <Icon icon={PlusIcon} tone="onAccent" size={20} weight="bold" />
              </View>
            </Pressable>
          </YStack>
        </YStack>

        <PendingInvites onAccepted={() => setReloadKey((k) => k + 1)} />

        {error ? (
          <ErrorState
            message={error}
            onRetry={() => {
              setError(null);
              setGroups(null);
            }}
          />
        ) : groups === null ? (
          <Stack.Vertical gap="$3">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                height={72}
                backgroundColor="$bgSurface"
                borderColor="$borderDefault"
                borderWidth={1}
                borderRadius="$lg"
                opacity={0.6}
              />
            ))}
          </Stack.Vertical>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Icon icon={PlusIcon} tone="textTertiary" size={32} weight="regular" />}
            title="No groups yet"
            description="Make your first group to start sharing lists with people."
            actionLabel="Create group"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <Stack.Vertical gap="$3">
            {groups.map((g) => (
              <ListItem
                key={g.id}
                leading={
                  <View
                    width={44}
                    height={44}
                    borderRadius="$lg"
                    backgroundColor="$bgSubtle"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={22}>{g.emoji}</Text>
                  </View>
                }
                title={g.name}
                description={`${g.memberCount} ${g.memberCount === 1 ? 'member' : 'members'}  ·  ${g.listCount} ${g.listCount === 1 ? 'list' : 'lists'}`}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/groups/[id]',
                    params: { id: g.id },
                  } as never)
                }
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
          router.push({
            pathname: '/(app)/groups/[id]',
            params: { id: groupId },
          } as never);
        }}
      />
    </Screen>
  );
}
