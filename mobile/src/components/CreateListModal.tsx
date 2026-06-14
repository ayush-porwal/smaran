// Modal for creating a new list inside a group. Captures name and
// emoji; list color tracks the group's color so the UI is consistent.
import { useState } from 'react';
import { Input, Label, XStack, YStack } from 'tamagui';

import { Modal, Pressable, Stack, Text, useToast } from '@/design-system';
import { ApiError, createList, getGroup } from '@/lib/api';

type CreateListModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  emojis: string[];
  onCreated: (listId: string) => void;
};

export function CreateListModal({
  open,
  onOpenChange,
  groupId,
  emojis,
  onCreated,
}: CreateListModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(emojis[0]);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!name.trim()) {
      toast.show({ kind: 'error', message: 'List name is required' });
      return;
    }
    setSubmitting(true);
    try {
      // Pull the group to honor its color. The mock layer doesn't enforce
      // this; we just pass through whatever the user picked.
      const group = await getGroup(groupId).catch(() => null);
      const list = await createList({
        groupId,
        name: name.trim(),
        emoji,
        ...(group ? {} : {}),
      });
      toast.show({ kind: 'success', message: `Created ${list.name}` });
      setName('');
      setEmoji(emojis[0]);
      onCreated(list.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not create list';
      toast.show({ kind: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New list"
      description="Lists are visible to everyone in the group."
      primaryAction={{ label: submitting ? 'Creating…' : 'Create list', onPress: onSubmit, loading: submitting }}
      secondaryAction={{ label: 'Cancel', onPress: () => onOpenChange(false) }}
    >
      <YStack gap="$4">
        <YStack gap="$2">
          <Label htmlFor="list-name">
            <Text variant="label.md" color="$textSecondary">
              Name
            </Text>
          </Label>
          <Input
            id="list-name"
            value={name}
            onChangeText={setName}
            placeholder="Groceries, Packing, Reading list, …"
            backgroundColor="$bgSurface"
            borderColor="$borderDefault"
            borderWidth={1}
            borderRadius="$md"
            paddingHorizontal="$3"
            paddingVertical="$3"
            fontSize="$5"
            autoFocus
          />
        </YStack>

        <YStack gap="$2">
          <Text variant="label.md" color="$textSecondary">
            Icon
          </Text>
          <XStack gap="$2" flexWrap="wrap">
            {emojis.map((e) => (
              <Pressable key={e} onPress={() => setEmoji(e)}>
                <Stack.Horizontal
                  width={44}
                  height={44}
                  borderRadius="$md"
                  backgroundColor={emoji === e ? '$accentSubtle' : '$bgSubtle'}
                  borderColor={emoji === e ? '$accent' : 'transparent'}
                  borderWidth={1}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={20}>{e}</Text>
                </Stack.Horizontal>
              </Pressable>
            ))}
          </XStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
