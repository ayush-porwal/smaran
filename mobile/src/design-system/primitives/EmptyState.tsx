import { YStack } from 'tamagui';
import type { ReactNode } from 'react';

import { Button } from './Button';
import { Text } from './Text';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
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
        <YStack marginTop="$4">
          <Button variant="filled" onPress={onAction}>
            {actionLabel}
          </Button>
        </YStack>
      ) : null}
    </YStack>
  );
}
