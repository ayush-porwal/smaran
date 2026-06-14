// Pressable with built-in press-scale animation. Tamagui's Pressable
// has an `animateScale` prop that does the same thing, but routing
// through PressableScale keeps the spec's motion pattern (springs.snappy,
// 0.97 scale) in one place. We use the native RN Pressable as the base
// because it's the recommended modern primitive (replaces Touchable*).
import { Pressable as RNPressable } from 'react-native';
import type { PressableProps as RNPressableProps } from 'react-native';
import type { ReactNode } from 'react';

import { PressableScale } from './motion';

export type PressableProps = Omit<RNPressableProps, 'children'> & {
  children: ReactNode | ((state: { pressed: boolean }) => ReactNode);
};

export function Pressable({ children, style, ...props }: PressableProps) {
  return (
    <RNPressable {...props}>
      {({ pressed }) => (
        <PressableScale pressedScale={pressed ? 0.97 : 1}>
          <>{typeof children === 'function' ? children({ pressed }) : children}</>
        </PressableScale>
      )}
    </RNPressable>
  );
}
