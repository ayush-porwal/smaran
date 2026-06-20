import { forwardRef } from 'react';
import { Input, Label, YStack, View } from 'tamagui';
import type { ComponentProps, ReactNode } from 'react';

import { Text } from './Text';

type InputProps = ComponentProps<typeof Input>;

type TextFieldProps = Omit<InputProps, 'size'> & {
  label?: string;
  helper?: string;
  error?: string;
  id?: string;
  // Input only — no label/helper slot (inline composers).
  bare?: boolean;
};

export const TextField = forwardRef<React.ElementRef<typeof Input>, TextFieldProps>(
  function TextField({ label, helper, error, id, bare, ...inputProps }, ref) {
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

    if (bare) return input;

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
