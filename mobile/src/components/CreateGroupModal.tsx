// Modal for creating a new group. Captures name, emoji, and a color
// (from the spec's six GroupColor options). On submit, calls
// `createGroup` and emits the new group's id to the parent so it can
// navigate to the new group's home.
import { useState } from 'react';
import { Input, Label, XStack, YStack } from 'tamagui';

import { Modal, Pressable, Stack, Text, useToast } from '@/design-system';
import { ApiError, createGroup, type Group, type GroupColor } from '@/lib/api';

const COLORS: { value: GroupColor; bg: string }[] = [
  { value: 'indigo', bg: '#5B5FE9' },
  { value: 'violet', bg: '#7C3AED' },
  { value: 'rose', bg: '#F43F5E' },
  { value: 'amber', bg: '#F59E0B' },
  { value: 'emerald', bg: '#10B981' },
  { value: 'sky', bg: '#0EA5E9' },
];

const EMOJIS = ['🏠', '✈️', '🎤', '🍳', '📚', '🎮', '🏖️', '💼', '🎉', '🐶'];

type CreateGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (groupId: string) => void;
};

export function CreateGroupModal({ open, onOpenChange, onCreated }: CreateGroupModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [color, setColor] = useState<GroupColor>('indigo');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!name.trim()) {
      toast.show({ kind: 'error', message: 'Group name is required' });
      return;
    }
    setSubmitting(true);
    try {
      const group = await createGroup({ name: name.trim(), emoji, color });
      toast.show({ kind: 'success', message: `Created ${group.name}` });
      setName('');
      setEmoji('🏠');
      setColor('indigo');
      onCreated(group.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not create group';
      toast.show({ kind: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New group"
      description="Groups are shared with the people you invite."
      primaryAction={{ label: submitting ? 'Creating…' : 'Create group', onPress: onSubmit, loading: submitting }}
      secondaryAction={{ label: 'Cancel', onPress: () => onOpenChange(false) }}
    >
      <YStack gap="$4">
        <YStack gap="$2">
          <Label htmlFor="group-name">
            <Text variant="label.md" color="$textSecondary">
              Name
            </Text>
          </Label>
          <Input
            id="group-name"
            value={name}
            onChangeText={setName}
            placeholder="Apartment, Trip to Lisbon, …"
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
            {EMOJIS.map((e) => (
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

        <YStack gap="$2">
          <Text variant="label.md" color="$textSecondary">
            Color
          </Text>
          <XStack gap="$2">
            {COLORS.map((c) => (
              <Pressable key={c.value} onPress={() => setColor(c.value)}>
                <Stack.Horizontal
                  width={32}
                  height={32}
                  borderRadius="$full"
                  backgroundColor={c.bg as `$${string}`}
                  borderColor={color === c.value ? '$textPrimary' : 'transparent'}
                  borderWidth={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  {color === c.value ? (
                    <Text color="$textInverse" fontSize={14} fontWeight="700">
                      ✓
                    </Text>
                  ) : null}
                </Stack.Horizontal>
              </Pressable>
            ))}
          </XStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
