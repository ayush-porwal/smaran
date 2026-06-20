import { Dialog, YStack, View } from 'tamagui';
import { type ReactNode } from 'react';

import { Button } from './Button';
import { Heading } from './Heading';
import { Text } from './Text';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  primaryAction?: { label: string; onPress: () => void; loading?: boolean };
  secondaryAction?: { label: string; onPress: () => void };
  destructive?: boolean;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  primaryAction,
  secondaryAction,
  destructive = false,
}: ModalProps) {
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          backgroundColor="rgba(0,0,0,0.5)"
        />
        <Dialog.Content
          key="content"
          backgroundColor="$bgSurface"
          borderColor="$borderDefault"
          borderWidth={1}
          borderRadius="$lg"
          padding="$6"
          width="90%"
          maxWidth={420}
          gap="$5"
        >
          {icon ? (
            <View
              alignSelf="center"
              width={56}
              height={56}
              borderRadius="$full"
              backgroundColor={destructive ? 'rgba(220, 38, 38, 0.10)' : '$accentSubtle'}
              alignItems="center"
              justifyContent="center"
            >
              {icon}
            </View>
          ) : null}
          <YStack gap="$2" alignItems="center">
            <Heading level={2} textAlign="center">
              {title}
            </Heading>
            {description ? (
              <Text
                variant="body.md"
                color="$textSecondary"
                textAlign="center"
                maxWidth={320}
              >
                {description}
              </Text>
            ) : null}
          </YStack>
          {children}
          {(primaryAction || secondaryAction) && (
            <YStack gap="$2" marginTop="$2">
              {primaryAction ? (
                <Button
                  variant={destructive ? 'danger' : 'filled'}
                  loading={primaryAction.loading}
                  onPress={primaryAction.onPress}
                  fullWidth
                >
                  {primaryAction.label}
                </Button>
              ) : null}
              {secondaryAction ? (
                <Button
                  variant="ghost"
                  tone="textSecondary"
                  onPress={secondaryAction.onPress}
                  fullWidth
                >
                  {secondaryAction.label}
                </Button>
              ) : null}
            </YStack>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
