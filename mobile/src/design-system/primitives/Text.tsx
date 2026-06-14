// Text with semantic variant prop. Mapping lives in tokens/typography.ts
// (`textVariants`) so adding/renaming variants is a one-file change.
// We wrap Tamagui's `Text` (not `SizableText`) because `SizableText`
// shadows the `variant` prop with its own size-based one. The variant
// prop is typed loosely because Tamagui's built-in Text types only
// know about Tamagui-default variants; our textVariants are pulled
// from the config and merged at the type level through a module
// augmentation file in `tamagui.config.ts`.
import { Text as TamaguiText, type TextProps as TamaguiTextProps } from 'tamagui';

import type { TextVariant } from '../tokens/typography';

// We intentionally widen the variant type beyond what Tamagui's stock
// Text types accept. The actual allowed values are exactly the keys of
// `textVariants` in tokens/typography.ts; anything else is a runtime
// no-op. The loose typing here trades a small amount of safety for
// being able to add new variants in one place.
export type TextProps = Omit<TamaguiTextProps, 'variant'> & {
  variant?: TextVariant;
};

export function Text({ color = '$textPrimary', ...props }: TextProps) {
  return <TamaguiText color={color as TamaguiTextProps['color']} {...props} />;
}
