// Custom Button — Tamagui's `color` prop doesn't reliably reach inner text
// (e.g. invisible labels on modal primary actions).
import { useTheme, View } from 'tamagui';
import { type ReactNode } from 'react';

import { Pressable } from './Pressable';
import { Text } from './Text';

function isTextLabel(child: ReactNode): child is string | number {
  return typeof child === 'string' || typeof child === 'number';
}

export type ButtonVariant = 'filled' | 'ghost' | 'danger';
export type ButtonTone = 'onAccent' | 'onDanger' | 'textPrimary' | 'textSecondary';

const TONE_TO_PROP_COLOR: Record<ButtonTone, string> = {
  onAccent: '$onAccent',
  onDanger: '$onDanger',
  textPrimary: '$textPrimary',
  textSecondary: '$textSecondary',
};

export type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
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

  const fg =
    tone ?? (variant === 'ghost' ? 'textPrimary' : variant === 'danger' ? 'onDanger' : 'onAccent');
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
          width={fullWidth ? '100%' : undefined}
          height={heights[size]}
          paddingHorizontal="$5"
          borderRadius="$md"
          backgroundColor={pressed ? bgPressed : bg}
          alignItems="center"
          justifyContent="center"
          opacity={isInert ? 0.5 : 1}
        >
          {isTextLabel(children) ? (
            <Text
              color={fgToken}
              fontSize={fontSize}
              fontWeight="600"
              textAlign="center"
              // Without flexShrink:0 the label collapses to zero width on Android.
              flexShrink={0}
            >
              {children}
            </Text>
          ) : (
            // Custom content must not be wrapped in <Text> — RN Text can't contain Views.
            children
          )}
        </View>
      )}
    </Pressable>
  );
}
