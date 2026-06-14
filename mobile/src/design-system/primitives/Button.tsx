// Button: full replacement for Tamagui's `Button` that we control
// end-to-end. Tamagui's Button has subtle `color` prop behavior that
// doesn't always reach the inner text in dev (we hit a case where the
// label was invisible on the modal's primary action).
//
// The public API mirrors the parts of Tamagui's Button we use:
//   - `variant`: filled | ghost | danger
//   - `tone`: textPrimary | textSecondary | onAccent | onDanger
//             (the foreground text color; defaults to onAccent for
//             filled/danger, textPrimary for ghost)
//   - `loading`: shows a dimmed state
//   - `disabled`: same
//
// Heights match our TextField (48) so form actions line up.
import { useTheme } from 'tamagui';
import { View } from 'tamagui';
import type { ReactNode } from 'react';

import { Pressable } from './Pressable';
import { Text } from './Text';

export type ButtonVariant = 'filled' | 'ghost' | 'danger';
export type ButtonTone = 'onAccent' | 'onDanger' | 'textPrimary' | 'textSecondary';

const ON_COLOR: Record<string, string> = {
  onAccent: '#FFFFFF',
  onDanger: '#FFFFFF',
};

const TONE_TO_PROP_COLOR: Record<ButtonTone, string> = {
  onAccent: '#FFFFFF',
  onDanger: '#FFFFFF',
  textPrimary: '$textPrimary',
  textSecondary: '$textSecondary',
};

export type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  // Override the text color (foreground). When omitted, picked from variant.
  tone?: ButtonTone;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  // Forwards extra styles to the outer Pressable. Use sparingly —
  // margin alignment is the main reason callers reach for this.
  style?: object;
};

export function Button({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'filled',
  tone,
  size = 'md',
  fullWidth = false,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isInert = disabled || loading;

  const bg = (() => {
    if (variant === 'filled') return (theme.accent as { val?: string }).val ?? '$accent';
    if (variant === 'danger') return (theme.danger as { val?: string }).val ?? '$danger';
    return 'transparent'; // ghost
  })();

  const bgPressed = (() => {
    if (variant === 'filled')
      return (theme.accentPressed as { val?: string }).val ?? '$accentPressed';
    if (variant === 'danger') return (theme.danger as { val?: string }).val ?? '$danger';
    return '$bgSubtle';
  })();

  const fg = tone ?? (variant === 'danger' ? 'onDanger' : 'onAccent');
  const fgHex = ON_COLOR[fg] ?? null;
  const fgToken = TONE_TO_PROP_COLOR[fg];

  const heights = { sm: 36, md: 48, lg: 56 } as const;
  const fontSize = size === 'sm' ? '$3' : size === 'lg' ? '$6' : '$5';

  return (
    <Pressable
      onPress={isInert ? undefined : onPress}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInert, busy: loading }}
      style={[style, { width: fullWidth ? '100%' : undefined }]}
    >
      {({ pressed }) => (
        <View
          height={heights[size]}
          paddingHorizontal="$5"
          borderRadius="$md"
          backgroundColor={pressed ? bgPressed : bg}
          alignItems="center"
          justifyContent="center"
          opacity={isInert ? 0.5 : 1}
        >
          <Text
            // Use hex for the "on-*" tones (constant white), token for others.
            color={fgHex ?? fgToken}
            fontSize={fontSize}
            fontWeight="600"
            numberOfLines={1}
          >
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
