// Wraps Tamagui Text (not SizableText) — SizableText shadows `variant` with its own size prop.
import { Text as TamaguiText, type TextProps as TamaguiTextProps } from 'tamagui';

import type { TextVariant } from '../tokens/typography';

export type TextProps = Omit<TamaguiTextProps, 'variant'> & {
  variant?: TextVariant;
};

export function Text({ color = '$textPrimary', ...props }: TextProps) {
  // Explicit `color` wins over variant defaults.
  return <TamaguiText {...props} color={color as TamaguiTextProps['color']} />;
}
