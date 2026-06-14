// Icon: thin wrapper around Phosphor icons that resolves a theme tone
// to a real hex color at render time. Phosphor (and the underlying
// react-native-svg) doesn't understand Tamagui's `$token` color
// strings, so a raw `<Plus color="$textTertiary" />` would render
// nothing. This primitive does the theme lookup for you.
//
// Tones are the design-system theme keys (see `tokens/colors.ts`).
// Pass them as the `tone` prop; we read the active theme via
// `useTheme()` and hand a hex string to Phosphor.
//
// The "Inverse" tone is special-cased to a static `#FFFFFF` because
// it lives only in the theme and not in `tokens.color` (the babel
// plugin only sees the static map). The few places that need text on
// the accent background can just pass `tone="accentText"` instead,
// which IS in the static map.
import { useTheme } from 'tamagui';
import type { ComponentType } from 'react';

import { themes } from '../tamagui.config';

// The icon component types from `phosphor-react-native`. We only need
// the props that vary at the call site; everything else is forwarded.
type PhosphorIcon = ComponentType<{
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  color?: string;
}>;

export type IconTone =
  | 'textPrimary'
  | 'textSecondary'
  | 'textTertiary'
  | 'accent'
  | 'accentText'
  | 'danger'
  | 'success'
  | 'warning';

export type IconProps = {
  icon: PhosphorIcon;
  tone?: IconTone;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  color?: string;
};

// `useTheme()` returns a map from token name to a `{ val, isVar, ... }`
// object. For hex strings the `.val` is what we want to hand to SVG.
function useIconColor(tone: IconTone, override?: string): string {
  if (override) return override;
  const t = useTheme();
  // `t[tone]` is a token entry; `.val` is the resolved hex string.
  const entry = t[tone] as { val?: string } | string | undefined;
  if (typeof entry === 'string') return entry;
  return entry?.val ?? themes.light[tone] ?? '#000000';
}

export function Icon({
  icon: IconComponent,
  tone = 'textPrimary',
  size = 20,
  weight = 'regular',
  color,
}: IconProps) {
  const resolved = useIconColor(tone, color);
  return <IconComponent size={size} weight={weight} color={resolved} />;
}
