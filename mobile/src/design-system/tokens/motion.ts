// Reanimated 3 spring/timing presets. Spec section 8.
// `withSpring` accepts `{ damping, stiffness, mass }`; `withTiming` takes
// a duration in ms and an easing function. We export both shapes so
// primitive motion components (FadeIn, Stagger, Checkable, etc.) can
// spread them into Reanimated's helpers.
export const springs = {
  standard: { damping: 20, stiffness: 200, mass: 1 },
  snappy: { damping: 18, stiffness: 320, mass: 0.8 },
  gentle: { damping: 26, stiffness: 160, mass: 1.2 },
  bouncy: { damping: 12, stiffness: 180, mass: 0.9 },
  stiff: { damping: 28, stiffness: 400, mass: 1 },
} as const;

export const timings = {
  micro: 120,
  short: 200,
  medium: 320,
  long: 480,
} as const;

// CSS-style cubic-bezier curves. Reanimated's `Easing.bezier` accepts
// a 4-tuple, so we keep the arrays in that shape.
export const easings = {
  standard: [0.2, 0, 0, 1] as const,
  accelerate: [0.3, 0, 1, 1] as const,
  emphasized: [0.2, 0, 0, 1] as const,
} as const;

export type SpringName = keyof typeof springs;
export type TimingName = keyof typeof timings;
export type EasingName = keyof typeof easings;
