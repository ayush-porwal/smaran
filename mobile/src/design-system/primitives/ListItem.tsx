// ListItem: a single row in a list. Has `leading`, `title`, optional
// `description`, and `trailing` slots. Pressable by default; set
// `onPress` to make it interactive. Disabled state dims opacity.
//
// Spec section 6: radius md (10). Spec section 8.3: list item press
// is a 0.97 scale via the inner PressableScale.
import { XStack, View } from 'tamagui';
import type { ReactNode } from 'react';

import { Pressable } from './Pressable';
import { Text } from './Text';

type ListItemProps = {
  leading?: ReactNode;
  title: string;
  description?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export function ListItem({
  leading,
  title,
  description,
  trailing,
  onPress,
  disabled = false,
}: ListItemProps) {
  const content = (
    <XStack
      paddingVertical="$3"
      paddingHorizontal="$3"
      gap="$3"
      alignItems="center"
      backgroundColor="$bgSurface"
      borderColor="$borderDefault"
      borderWidth={1}
      borderRadius="$lg"
      opacity={disabled ? 0.4 : 1}
    >
      {leading ? <View>{leading}</View> : null}
      <View flex={1}>
        <Text variant="heading.sm" numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text variant="body.sm" color="$textSecondary" numberOfLines={1} marginTop="$1">
            {description}
          </Text>
        ) : null}
      </View>
      {trailing}
    </XStack>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {content}
    </Pressable>
  );
}
