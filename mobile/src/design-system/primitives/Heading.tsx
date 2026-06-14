// Heading with semantic levels. h1/h2/h3/h4 map to display/heading
// variants from the type scale. Use instead of raw Text with
// `variant="heading.*"` for semantic HTML structure (a11y).
import { Text } from './Text';
import type { TextProps } from './Text';

export type HeadingLevel = 1 | 2 | 3 | 4;

const levelToVariant: Record<HeadingLevel, NonNullable<TextProps['variant']>> = {
  1: 'display.md',
  2: 'display.sm',
  3: 'heading.md',
  4: 'heading.sm',
};

export function Heading({
  level = 2,
  variant,
  ...props
}: TextProps & { level?: HeadingLevel }) {
  return (
    <Text
      role="heading"
      variant={variant ?? levelToVariant[level]}
      {...props}
    />
  );
}
