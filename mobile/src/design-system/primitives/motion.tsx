// Tamagui enterStyle/exitStyle only run on mount/unmount — Reanimated handles press/reorder feedback.
import { useEffect } from 'react';
import { type ViewStyle, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';

import { springs, timings, easings } from '../tokens/motion';
import { useTheme } from 'tamagui';
import { Text } from './Text';
import { type TextProps } from './Text';

const SPRING_OPTS = springs.snappy;

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
        scale.value = withSpring(pressedScale, SPRING_OPTS);
      }}
      onTouchEnd={() => {
        if (reduced) return;
        scale.value = withSpring(1, SPRING_OPTS);
      }}
      onTouchCancel={() => {
        if (reduced) return;
        scale.value = withSpring(1, SPRING_OPTS);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

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
  const strikeHex = typeof strikeColor === 'string' ? strikeColor : strikeColor.val;
  // onTextLayout reports line width, not container width — works when parent has flex={1}.
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
      <Text variant="body.md" style={style as TextProps['style']} {...({ onTextLayout } as object)}>
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
