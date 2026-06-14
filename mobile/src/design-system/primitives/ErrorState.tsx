// ErrorState: drop-in for screens that failed to load. Distinct from
// EmptyState because the user has experienced a failure, not an absence.
// Shows a danger icon, an error message, and a retry button.
import { YStack, Button } from 'tamagui';
import { Warning } from 'phosphor-react-native';

import { Text } from './Text';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" paddingHorizontal="$6">
      <Warning size={32} weight="regular" color="$danger" />
      <Text variant="heading.md" textAlign="center">
        {title}
      </Text>
      <Text variant="body.md" color="$textSecondary" textAlign="center" maxWidth={320}>
        {message}
      </Text>
      {onRetry ? (
        <Button
          marginTop="$4"
          backgroundColor="$accent"
          color="$textInverse"
          fontWeight="600"
          paddingHorizontal="$5"
          paddingVertical="$3"
          borderRadius="$md"
          onPress={onRetry}
          pressStyle={{ backgroundColor: '$accentPressed' }}
        >
          Try again
        </Button>
      ) : null}
    </YStack>
  );
}
