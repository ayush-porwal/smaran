// Reusable motion primitives. Spec section 8.3.
//
// Why custom rather than relying on Tamagui's `enterStyle`/`exitStyle`:
// those only run on mount/unmount, not on press feedback or item
// reordering, which is what most of our motion needs to do. Reanimated
// 3 worklets give us 60fps on the UI thread for free.
//
// Every primitive respects `useReducedMotion()` and falls back to a
// short opacity fade so users with motion sensitivity still get a
// transition, just not a spring.
import { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
 useReducedMotion } from 'react-native-reanimated';

import { springs, timings, easings } from '../tokens/motion';

// Checkable: animated check-off wrapper. Drives a strike-through width
// from 0% to 100% and a text-color fade to `text.tertiary`.
// `checked` is controlled; toggle by flipping the prop.
import { type TextStyle } from 'react-native';
import { useTheme } from 'tamagui';
import { Text } from './Text';
import { type TextProps } from './Text';

const SPRING_OPTS = springs.snappy;

// FadeIn: mount a child with opacity 0 -> 1 and a small upward translate.
// Common for empty states, error blocks, page-level reveals.
export function FadeIn({
  children,
  delay = 0,
  duration = timings.short,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);
  const translateY = useSharedValue(reduced ? 0 : 8);

  useEffect(() => {
    if (reduced) return;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.bezier(...easings.standard) }),
    );
    translateY.value = withDelay(delay, withTiming(0, { duration }));
  }, [delay, duration, opacity, reduced, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

// PressableScale: drop-in replacement for the inner of any Pressable.
// Wraps children in a view that scales to 0.97 on press-in and springs
// back on release. Reanimated worklet, runs on UI thread.
export function PressableScale({
  children,
  pressedScale = 0.97,
  style,
}: {
  children: React.ReactNode;
  pressedScale?: number;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      onTouchStart={() => {
        if (reduced) return;
        // `SharedValue.value` is mutated here on purpose — Reanimated
        // tracks the assignment and schedules the value change on the
        // UI thread. The react-hooks/immutability rule is overly
        // strict for this library's contract.
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(pressedScale, SPRING_OPTS);
      }}
      onTouchEnd={() => {
        if (reduced) return;
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(1, SPRING_OPTS);
      }}
      onTouchCancel={() => {
        if (reduced) return;
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(1, SPRING_OPTS);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

// Stagger: pass children an `index` prop and a render function to drive
// a 30ms-stagger fade-in. Spec section 8.3 list entry pattern.
export function StaggerItem({
  index,
  children,
  step = 30,
  style,
}: {
  index: number;
  children: React.ReactNode;
  step?: number;
  style?: ViewStyle;
}) {
  return (
    <FadeIn delay={index * step} style={style}>
      {children}
    </FadeIn>
  );
}

export function Checkable({
  checked,
  children,
  style,
}: {
  checked: boolean;
  children: React.ReactNode;
  style?: TextStyle;
}) {
  const reduced = useReducedMotion();
  const theme = useTheme();
  const strikeColor = (theme.textPrimary as { val: string } | string) ?? '#000';
  const strikeHex =
    typeof strikeColor === 'string' ? strikeColor : strikeColor.val;
  // Measured text content width (px) — the strike line grows from 0
  // to this value. Stored in a shared value so the animated style can
  // read it on the UI thread without a React re-render.
  // `onTextLayout` reports each line's actual rendered width, NOT the
  // container width — so it works correctly even when the parent
  // YStack has `flex={1}` and stretches the Text to fill the row.
  const textWidth = useSharedValue(0);
  const strikeWidth = useSharedValue(checked ? 1 : 0);
  const opacity = useSharedValue(checked ? 0.5 : 1);

  useEffect(() => {
    if (reduced) {
      strikeWidth.value = checked ? 1 : 0;
      opacity.value = checked ? 0.5 : 1;
      return;
    }
    strikeWidth.value = withSpring(checked ? 1 : 0, springs.standard);
    opacity.value = withTiming(checked ? 0.5 : 1, {
      duration: timings.short,
      easing: Easing.bezier(...easings.standard),
    });
  }, [checked, opacity, reduced, strikeWidth]);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Width in pixels = measured text width × animated 0..1 factor.
  // This way the line only ever spans the text width regardless of
  // how wide the parent row is.
  const strikeAnimatedStyle = useAnimatedStyle(() => ({
    width: textWidth.value * strikeWidth.value,
  }));

  const onTextLayout = (e: { nativeEvent: { lines: { width: number }[] } }) => {
    const lines = e.nativeEvent.lines;
    if (!lines || lines.length === 0) return;
    const widest = lines.reduce((max, l) => Math.max(max, l.width), 0);
    if (widest > 0) textWidth.value = widest;
  };

  return (
    <Animated.View style={textAnimatedStyle}>
      <Text
        variant="body.md"
        style={style as TextProps['style']}
        {...({ onTextLayout } as object)}
      >
        {children}
      </Text>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            top: '50%',
            height: 1.5,
            backgroundColor: strikeHex,
          },
          strikeAnimatedStyle,
        ]}
      />
    </Animated.View>
  );
}
