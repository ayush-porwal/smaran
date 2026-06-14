// EmptyState: icon + title + description + optional CTA. Used inside
// screens when the underlying data is empty ("No groups yet — make your
// first one"). Centered vertically and horizontally.
import { YStack } from 'tamagui';
import type { ReactNode } from 'react';

import { Text } from './Text';
import { Button } from 'tamagui';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" paddingHorizontal="$6">
      {icon ? <YStack marginBottom="$2">{icon}</YStack> : null}
      <Text variant="heading.md" textAlign="center">
        {title}
      </Text>
      {description ? (
        <Text variant="body.md" color="$textSecondary" textAlign="center" maxWidth={320}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          marginTop="$4"
          backgroundColor="$accent"
          color="$textInverse"
          fontWeight="600"
          paddingHorizontal="$5"
          paddingVertical="$3"
          borderRadius="$md"
          onPress={onAction}
          pressStyle={{ backgroundColor: '$accentPressed' }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </YStack>
  );
}
