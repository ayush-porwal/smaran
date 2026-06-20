// Backend enforces invariants (e.g. at least one admin); UI surfaces errors via toast.
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ScrollView, View, YStack } from 'tamagui';

import { Button, Modal, Pressable, Stack, Text, useToast } from '@/design-system';
import {
  ApiError,
  deleteGroup,
  leaveGroup,
  listGroupMembers,
  removeMember,
  setMemberRole,
  type GroupMembership,
  type User,
} from '@/lib/api';

type Member = GroupMembership & { user: User };

type MembersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  currentUserId: string;
  isAdmin: boolean;
  onMembersChanged: () => void;
  onLeftGroup: () => void;
};

function displayName(m: Member): string {
  return m.user.name || m.user.email || 'Member';
}

export function MembersModal({
  open,
  onOpenChange,
  groupId,
  groupName,
  currentUserId,
  isAdmin,
  onMembersChanged,
  onLeftGroup,
}: MembersModalProps) {
  const toast = useToast();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(() => {
    listGroupMembers(groupId)
      .then(setMembers)
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Couldn't load members";
        toast.show({ kind: 'error', message });
        setMembers([]);
      });
  }, [groupId, toast]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMembers(null);
    load();
  }, [open, load]);

  async function onToggleRole(m: Member) {
    const nextRole = m.role === 'admin' ? 'member' : 'admin';
    setBusyId(m.userId);
    try {
      const updated = await setMemberRole(groupId, m.userId, nextRole);
      setMembers((prev) =>
        (prev ?? []).map((x) => (x.userId === m.userId ? { ...x, role: updated.role } : x)),
      );
      toast.show({
        kind: 'success',
        message:
          nextRole === 'admin'
            ? `${displayName(m)} is now an admin`
            : `${displayName(m)} is now a member`,
      });
      onMembersChanged();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't update role";
      toast.show({ kind: 'error', message });
    } finally {
      setBusyId(null);
    }
  }

  function confirmRemove(m: Member) {
    Alert.alert('Remove member', `Remove ${displayName(m)} from ${groupName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void onRemove(m),
      },
    ]);
  }

  async function onRemove(m: Member) {
    setBusyId(m.userId);
    try {
      await removeMember(groupId, m.userId);
      setMembers((prev) => (prev ?? []).filter((x) => x.userId !== m.userId));
      toast.show({ kind: 'success', message: `Removed ${displayName(m)}` });
      onMembersChanged();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't remove member";
      toast.show({ kind: 'error', message });
    } finally {
      setBusyId(null);
    }
  }

  function confirmLeave() {
    Alert.alert('Leave group', `Leave ${groupName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => void onLeave() },
    ]);
  }

  async function onLeave() {
    setLeaving(true);
    try {
      await leaveGroup(groupId);
      toast.show({ kind: 'success', message: `Left ${groupName}` });
      onOpenChange(false);
      onLeftGroup();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't leave the group";
      toast.show({ kind: 'error', message });
    } finally {
      setLeaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete group',
      `Delete ${groupName} and all of its lists for everyone? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void onDelete() },
      ],
    );
  }

  async function onDelete() {
    setLeaving(true);
    try {
      await deleteGroup(groupId);
      toast.show({ kind: 'success', message: `Deleted ${groupName}` });
      onOpenChange(false);
      onLeftGroup();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't delete the group";
      toast.show({ kind: 'error', message });
    } finally {
      setLeaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Members"
      description={
        isAdmin ? "Manage who's in the group and what they can do." : 'Everyone in this group.'
      }
      secondaryAction={{ label: 'Done', onPress: () => onOpenChange(false) }}
    >
      <YStack gap="$4">
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          <Stack.Vertical gap="$2">
            {members === null ? (
              <Text variant="body.sm" color="$textTertiary">
                Loading…
              </Text>
            ) : (
              members.map((m) => {
                const isSelf = m.userId === currentUserId;
                const name = displayName(m);
                return (
                  <View
                    key={m.userId}
                    flexDirection="row"
                    alignItems="center"
                    gap="$3"
                    paddingVertical="$2"
                  >
                    <View
                      width={36}
                      height={36}
                      borderRadius="$full"
                      backgroundColor="$bgSubtle"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text variant="label.sm" color="$textSecondary">
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <YStack flex={1}>
                      <Text variant="body.md" color="$textPrimary" fontWeight="500">
                        {name}
                        {isSelf ? ' (you)' : ''}
                      </Text>
                      <Text variant="body.sm" color="$textTertiary">
                        {m.role === 'admin' ? 'Admin' : 'Member'}
                      </Text>
                    </YStack>
                    {isAdmin && !isSelf ? (
                      <Stack.Horizontal alignItems="center" gap="$1">
                        <Button
                          size="sm"
                          variant="ghost"
                          tone="textPrimary"
                          onPress={() => onToggleRole(m)}
                          loading={busyId === m.userId}
                        >
                          {m.role === 'admin' ? 'Make member' : 'Make admin'}
                        </Button>
                        <Pressable
                          onPress={() => confirmRemove(m)}
                          accessibilityLabel={`Remove ${name}`}
                          hitSlop={8}
                          disabled={busyId === m.userId}
                        >
                          <Text variant="body.sm" color="$danger" paddingHorizontal="$2">
                            Remove
                          </Text>
                        </Pressable>
                      </Stack.Horizontal>
                    ) : null}
                  </View>
                );
              })
            )}
          </Stack.Vertical>
        </ScrollView>

        <YStack gap="$2">
          <Button
            variant="ghost"
            tone="textPrimary"
            fullWidth
            onPress={confirmLeave}
            loading={leaving}
          >
            Leave group
          </Button>
          {isAdmin ? (
            <Button variant="danger" fullWidth onPress={confirmDelete} loading={leaving}>
              Delete group
            </Button>
          ) : null}
        </YStack>
      </YStack>
    </Modal>
  );
}
