// Modal: thin wrapper over Tamagui's `Dialog` that uses our motion
// timings and theme tokens. Use for confirmations, full-screen forms,
// or any focused task that needs to interrupt the underlying screen.
//
// Sheet (bottom drawer) is from Tamagui's `Sheet` and is exported
// separately. Modals are center-prompt; sheets slide from the bottom.
import { Dialog, YStack, Button } from 'tamagui';
import { type ReactNode } from 'react';

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
          // Reanimated-driven entry/exit handled by Tamagui.
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
                  backgroundColor={destructive ? '$danger' : '$accent'}
                  color="#FFFFFF"
                  fontWeight="600"
                  paddingVertical="$3"
                  borderRadius="$md"
                  onPress={primaryAction.onPress}
                  disabled={primaryAction.loading}
                  pressStyle={{
                    backgroundColor: destructive ? '$danger' : '$accentPressed',
                  }}
                >
                  {primaryAction.label}
                </Button>
              ) : null}
              {secondaryAction ? (
                <Button
                  backgroundColor="transparent"
                  color="$textSecondary"
                  fontWeight="500"
                  paddingVertical="$3"
                  borderRadius="$md"
                  onPress={secondaryAction.onPress}
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
