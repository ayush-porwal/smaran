// Modal: thin wrapper over Tamagui's `Dialog` that uses our motion
// timings and theme tokens. Use for confirmations, full-screen forms,
// or any focused task that needs to interrupt the underlying screen.
//
// Sheet (bottom drawer) is from Tamagui's `Sheet` and is exported
// separately. Modals are center-prompt; sheets slide from the bottom.
import { Dialog, YStack } from 'tamagui';
import { type ReactNode } from 'react';

import { Button } from './Button';
import { Heading } from './Heading';
import { Text } from './Text';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
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
          gap="$4"
        >
          <YStack gap="$2">
            <Heading level={3}>{title}</Heading>
            {description ? (
              <Text variant="body.md" color="$textSecondary">
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
                <Button variant="ghost" tone="textSecondary" onPress={secondaryAction.onPress} fullWidth>
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
