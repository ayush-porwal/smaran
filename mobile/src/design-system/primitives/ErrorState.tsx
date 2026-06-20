import { YStack } from "tamagui";

import { Button } from "./Button";
import { Icon } from "./Icon";
import { Text } from "./Text";
import { WarningIcon } from "phosphor-react-native";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap="$3"
      paddingHorizontal="$6"
    >
      <Icon icon={WarningIcon} tone="danger" size={32} weight="regular" />
      <Text variant="heading.md" textAlign="center">
        {title}
      </Text>
      <Text
        variant="body.md"
        color="$textSecondary"
        textAlign="center"
        maxWidth={320}
      >
        {message}
      </Text>
      {onRetry ? (
        <YStack marginTop="$4">
          <Button variant="filled" onPress={onRetry}>
            Try again
          </Button>
        </YStack>
      ) : null}
    </YStack>
  );
}
