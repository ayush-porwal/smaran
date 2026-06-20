// Resolves theme tokens to hex — Phosphor/react-native-svg ignore Tamagui `$token` strings.
//
// Use onAccent/onDanger on colored fills; accentText is for links beside surfaces.
import { useTheme } from "tamagui";
import type { ComponentType } from "react";

type PhosphorIcon = ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
}>;

export type IconTone =
  | "textPrimary"
  | "textSecondary"
  | "textTertiary"
  | "accent"
  | "accentText"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | "onAccent"
  | "onDanger";

export type IconProps = {
  icon: PhosphorIcon;
  tone?: IconTone;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
};

function useIconColor(tone: IconTone, override?: string): string {
  const t = useTheme();
  if (override) return override;
  const entry = t[tone] as { val?: string } | string | undefined;
  if (typeof entry === "string") return entry;
  if (entry?.val) return entry.val;
  const fallback = t.textPrimary as { val?: string } | string | undefined;
  if (typeof fallback === "string") return fallback;
  if (fallback?.val) return fallback.val;
  return "#0A0A0A";
}

export function Icon({
  icon: IconComponent,
  tone = "textPrimary",
  size = 20,
  weight = "regular",
  color,
}: IconProps) {
  const resolved = useIconColor(tone, color);
  return <IconComponent size={size} weight={weight} color={resolved} />;
}
