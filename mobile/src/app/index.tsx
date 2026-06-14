// Boot-check screen. Exercises every primitive and theme token once so
// regressions in the design system surface here before they reach a
// real feature screen. Phase 1 replaces this with the sign-in route.
import { Bell, Plus, Sparkle } from 'phosphor-react-native';

import {
  AvatarStack,
  Box,
  EmptyState,
  Heading,
  ListItem,
  Pressable,
  Screen,
  Stack,
  Text,
  useThemeControls,
  useToast,
} from '@/design-system';

export default function HomeScreen() {
  const toast = useToast();
  const { preference, setPreference } = useThemeControls();

  return (
    <Screen>
      <Stack.Vertical flex={1} gap="$4">
        <Heading level={1}>Smaran</Heading>
        <Text variant="body.md" color="$textSecondary">
          Phase 0 design system boot check
        </Text>

        <Stack.Vertical gap="$2" marginTop="$4">
          <Text variant="label.sm" color="$textTertiary">
            Typography
          </Text>
          <Text variant="display.md">Display md</Text>
          <Text variant="heading.lg">Heading lg</Text>
          <Text variant="body.lg">Body lg — the quick brown fox</Text>
          <Text variant="body.md">Body md — the quick brown fox</Text>
          <Text variant="body.sm">Body sm — the quick brown fox</Text>
          <Text variant="label.md">Label md</Text>
        </Stack.Vertical>

        <Stack.Vertical gap="$2" marginTop="$4">
          <Text variant="label.sm" color="$textTertiary">
            Surfaces
          </Text>
          <Box backgroundColor="$bgSurface" borderColor="$borderDefault" borderWidth={1} borderRadius="$md" padding="$4">
            <Text variant="body.md">bg.surface with border</Text>
          </Box>
          <Box backgroundColor="$bgSubtle" borderRadius="$md" padding="$4">
            <Text variant="body.md">bg.subtle (no border)</Text>
          </Box>
        </Stack.Vertical>

        <Stack.Vertical gap="$2" marginTop="$4">
          <Text variant="label.sm" color="$textTertiary">
            Components
          </Text>
          <Pressable onPress={() => toast.show({ kind: 'success', message: 'Pressed!' })}>
            <Box backgroundColor="$accent" borderRadius="$md" paddingVertical="$3" paddingHorizontal="$4">
              <Text color="$textInverse" fontWeight="600" textAlign="center">
                Show toast
              </Text>
            </Box>
          </Pressable>
          <ListItem
            leading={<Sparkle size={20} weight="regular" />}
            title="List item with leading icon"
            description="Secondary line of metadata"
            trailing={<Bell size={18} weight="regular" color="$textTertiary" />}
            onPress={() => toast.show({ kind: 'info', message: 'List item tapped' })}
          />
          <AvatarStack
            members={[
              { id: '1', name: 'Ada Lovelace' },
              { id: '2', name: 'Grace Hopper' },
              { id: '3', name: 'Linus Torvalds' },
              { id: '4', name: 'Donald Knuth' },
              { id: '5', name: 'Alan Kay' },
              { id: '6', name: 'Edsger Dijkstra' },
            ]}
            max={4}
          />
        </Stack.Vertical>

        <Stack.Vertical gap="$2" marginTop="$4">
          <Text variant="label.sm" color="$textTertiary">
            Empty state
          </Text>
          <Box height={220} borderColor="$borderDefault" borderWidth={1} borderRadius="$md" overflow="hidden">
            <EmptyState
              icon={<Plus size={32} weight="regular" />}
              title="No groups yet"
              description="Make your first group to start sharing lists with people."
              actionLabel="Create group"
              onAction={() => toast.show({ kind: 'info', message: 'Create group' })}
            />
          </Box>
        </Stack.Vertical>

        <Stack.Vertical gap="$2" marginTop="$4">
          <Text variant="label.sm" color="$textTertiary">
            Theme
          </Text>
          <Text variant="body.md">Current preference: {preference}</Text>
          <Stack.Horizontal gap="$2">
            <Pressable onPress={() => setPreference('light')}>
              <Box backgroundColor="$bgSurface" borderColor="$borderDefault" borderWidth={1} borderRadius="$md" padding="$3">
                <Text variant="body.md">Light</Text>
              </Box>
            </Pressable>
            <Pressable onPress={() => setPreference('dark')}>
              <Box backgroundColor="$bgSurface" borderColor="$borderDefault" borderWidth={1} borderRadius="$md" padding="$3">
                <Text variant="body.md">Dark</Text>
              </Box>
            </Pressable>
            <Pressable onPress={() => setPreference('system')}>
              <Box backgroundColor="$bgSurface" borderColor="$borderDefault" borderWidth={1} borderRadius="$md" padding="$3">
                <Text variant="body.md">System</Text>
              </Box>
            </Pressable>
          </Stack.Horizontal>
        </Stack.Vertical>
      </Stack.Vertical>
    </Screen>
  );
}
