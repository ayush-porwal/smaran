// Single import path for the design system. Feature code does:
//   import { Screen, Text, Pressable, useTheme } from '@/design-system';
// rather than reaching into individual files. Keeps the surface narrow
// and refactors easy.
export * from './tamagui.config';
export * from './tokens';
export * from './theme';
export * from './primitives/Box';
export * from './primitives/Stack';
export * from './primitives/Text';
export * from './primitives/Heading';
export * from './primitives/TextField';
export * from './primitives/Icon';
export * from './primitives/Screen';
export * from './primitives/Pressable';
export * from './primitives/ListItem';
export * from './primitives/List';
export * from './primitives/EmptyState';
export * from './primitives/ErrorState';
export * from './primitives/Toast';
export * from './primitives/AvatarStack';
export * from './primitives/Modal';
export * from './primitives/Button';
export * from './primitives/SwipeableRow';
export * from './primitives/motion';
export * from './hooks/useHideTabBar';
