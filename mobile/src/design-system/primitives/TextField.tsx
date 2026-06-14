// TextField: a single-line text input with our theme defaults baked in.
// Wraps Tamagui's `Input` and standardizes height, padding, focus ring,
// and error state. The "label" and "helper" slots are for accessibility
// and visual structure; if you need help text, pass it in.
//
// The min height matches Apple's HIG recommendation (44pt) and
// Material's touch target minimum. Larger than `$5` line-height alone
// would produce, but still feels light because the padding is `$3`.
//
// Use this anywhere you'd otherwise reach for a raw `<Input>`.
import { forwardRef } from 'react';
import { Input, Label, YStack, View } from 'tamagui';
import type { ComponentProps, ReactNode } from 'react';

import { Text } from './Text';

type InputProps = ComponentProps<typeof Input>;

type TextFieldProps = Omit<InputProps, 'size'> & {
  label?: string;
  helper?: string;
  error?: string;
  // The id used by the visible <Label htmlFor=...> binding. Defaults
  // to undefined, in which case no explicit `for` is set (Label wraps
  // the input for implicit association).
  id?: string;
};

export const TextField = forwardRef<React.ElementRef<typeof Input>, TextFieldProps>(
  function TextField({ label, helper, error, id, ...inputProps }, ref) {
    const input = (
      <Input
        ref={ref}
        id={id}
        backgroundColor="$bgSurface"
        borderColor={error ? '$danger' : '$borderDefault'}
        borderWidth={1}
        borderRadius="$md"
        paddingHorizontal="$4"
        height={48}
        fontSize="$5"
        color="$textPrimary"
        placeholderTextColor="$textTertiary"
        focusStyle={{
          borderColor: error ? '$danger' : '$accent',
          borderWidth: 2,
        }}
        {...inputProps}
      />
    );

    return (
      <YStack gap="$2">
        {label ? (
          id ? (
            <Label htmlFor={id}>
              <Text variant="label.md" color="$textSecondary">
                {label}
              </Text>
            </Label>
          ) : (
            <View>
              <Text variant="label.md" color="$textSecondary">
                {label}
              </Text>
            </View>
          )
        ) : null}
        {input}
        {error ? (
          <Text variant="body.sm" color="$danger">
            {error}
          </Text>
        ) : helper ? (
          <Text variant="body.sm" color="$textTertiary">
            {helper}
          </Text>
        ) : null}
      </YStack>
    );
  }
);

export type { TextFieldProps };
