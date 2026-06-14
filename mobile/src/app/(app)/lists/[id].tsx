// List detail. Renders items in a FlashList-backed List. Tapping the
// leading checkbox toggles the item via `toggleItem`; the row animates
// the strike-through and dim transition from the `Checkable` motion
// pattern. The composer at the bottom adds items via `addItem`.
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash } from 'phosphor-react-native';
import { Input, YStack, View, XStack } from 'tamagui';

import {
  Checkable,
  FadeIn,
  Icon,
  Pressable,
  Screen,
  Stack,
  Text,
  useToast,
} from '@/design-system';
import {
  addItem,
  ApiError,
  deleteItem,
  getList,
  itemsInList,
  toggleItem,
  type List as ListModel,
  type ListItem as ListItemModel,
} from '@/lib/api';
import { useStoreVersion } from '@/lib/api/useStoreVersion';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const listVersion = useStoreVersion(`list:${id ?? ''}`);

  const [list, setList] = useState<ListModel | null>(null);
  const [items, setItems] = useState<ListItemModel[]>([]);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([getList(id), itemsInList(id)])
      .then(([l, its]) => {
        if (cancelled) return;
        setList(l);
        setItems(its);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.show({ kind: 'error', message: err instanceof ApiError ? err.message : 'Failed' });
      });
    return () => {
      cancelled = true;
    };
  }, [id, listVersion, toast]);

  const onAdd = useCallback(async () => {
    if (!id || !draft.trim()) return;
    setSubmitting(true);
    try {
      await addItem({ listId: id, text: draft.trim() });
      setDraft('');
    } catch (err) {
      toast.show({ kind: 'error', message: err instanceof ApiError ? err.message : 'Failed' });
    } finally {
      setSubmitting(false);
    }
  }, [id, draft, toast]);

  const onToggle = useCallback(
    async (itemId: string) => {
      try {
        await toggleItem(itemId);
      } catch (err) {
        toast.show({ kind: 'error', message: err instanceof ApiError ? err.message : 'Failed' });
      }
    },
    [toast],
  );

  const onDelete = useCallback(
    async (itemId: string) => {
      try {
        await deleteItem(itemId);
      } catch (err) {
        toast.show({ kind: 'error', message: err instanceof ApiError ? err.message : 'Failed' });
      }
    },
    [toast],
  );

  if (!list) {
    return <Screen><Text>Loading…</Text></Screen>;
  }

  const completed = items.filter((i) => i.checked).length;
  const total = items.length;

  return (
    <Screen padded={false}>
      <YStack flex={1}>
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$4"
          paddingVertical="$2"
        >
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
          <Text variant="label.sm" color="$textTertiary">
            {completed} of {total} done
          </Text>
          <View width={40} />
        </XStack>

        <YStack paddingHorizontal="$4" gap="$1" marginBottom="$4">
          <XStack alignItems="center" gap="$3">
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
              <Text fontSize={28}>{list.emoji}</Text>
            </View>
            <YStack flex={1}>
              <Text variant="display.md">{list.name}</Text>
            </YStack>
          </XStack>
        </YStack>

        <Stack.Vertical flex={1} paddingHorizontal="$4" gap="$1">
          {items.length === 0 ? (
            <FadeIn>
              <Text
                variant="body.md"
                color="$textTertiary"
                textAlign="center"
                paddingVertical="$8"
              >
                Nothing here yet. Add the first item below.
              </Text>
            </FadeIn>
          ) : (
            items.map((item, idx) => (
              <FadeIn key={item.id} delay={idx * 24}>
                <XStack
                  alignItems="center"
                  gap="$3"
                  paddingVertical="$3"
                  paddingHorizontal="$2"
                  borderRadius="$md"
                >
                  <Pressable
                    onPress={() => onToggle(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.checked }}
                  >
                    <View
                      width={22}
                      height={22}
                      borderRadius="$sm"
                      borderColor={item.checked ? '$accent' : '$borderStrong'}
                      borderWidth={1.5}
                      backgroundColor={item.checked ? '$accent' : 'transparent'}
                      alignItems="center"
                      justifyContent="center"
                    >
                      {item.checked ? (
                        <Text fontSize={14} fontWeight="700" color="#FFFFFF">
                          ✓
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                  <YStack flex={1}>
                    <Checkable checked={item.checked}>{item.text}</Checkable>
                  </YStack>
                  <Pressable
                    onPress={() => onDelete(item.id)}
                    accessibilityLabel={`Delete ${item.text}`}
                  >
                    <View padding="$2">
                      <Icon icon={Trash} tone="textTertiary" size={18} weight="regular" />
                    </View>
                  </Pressable>
                </XStack>
              </FadeIn>
            ))
          )}
        </Stack.Vertical>

        {/* Composer */}
        <XStack
          alignItems="center"
          gap="$2"
          paddingHorizontal="$4"
          paddingTop="$3"
          paddingBottom="$4"
          borderTopColor="$borderDefault"
          borderTopWidth={1}
          backgroundColor="$bgSurface"
        >
          <Input
            value={draft}
            onChangeText={setDraft}
            placeholder="Add an item…"
            backgroundColor="$bgSurface"
            borderColor="$borderDefault"
            borderWidth={1}
            borderRadius="$md"
            paddingHorizontal="$4"
            height={48}
            fontSize="$5"
            color="$textPrimary"
            placeholderTextColor="$textTertiary"
            flex={1}
            onSubmitEditing={onAdd}
            returnKeyType="done"
            focusStyle={{
              borderColor: '$accent',
              borderWidth: 2,
            }}
          />
          <Pressable onPress={onAdd} disabled={!draft.trim() || submitting}>
            <View
              width={48}
              height={48}
              borderRadius="$full"
              backgroundColor={draft.trim() ? '$accent' : '$bgMuted'}
              alignItems="center"
              justifyContent="center"
            >
              <Icon
                icon={Plus}
                tone={draft.trim() ? 'accentText' : 'textTertiary'}
                size={20}
                weight="bold"
              />
            </View>
          </Pressable>
        </XStack>
      </YStack>
    </Screen>
  );
}
