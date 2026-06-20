import { Text } from "./Text";
import type { TextProps } from "./Text";

export type HeadingLevel = 1 | 2 | 3 | 4;

const levelToVariant: Record<
  HeadingLevel,
  NonNullable<TextProps["variant"]>
> = {
  1: "display.md",
  2: "display.sm",
  3: "heading.md",
  4: "heading.sm",
};

export function Heading({
  level = 2,
  variant,
  ...props
}: TextProps & { level?: HeadingLevel }) {
  const resolvedVariant = variant ?? levelToVariant[level];
  const { color, ...rest } = props;
  return (
    <Text
      role="heading"
      {...rest}
      variant={resolvedVariant}
      {...(color !== undefined ? { color } : {})}
    />
  );
}
