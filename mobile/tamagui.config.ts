import { createTamagui } from 'tamagui';
import { config as defaultConfig } from '@tamagui/config';

// Skeleton config: real tokens (indigo accent, full neutral scale, motion
// mappings) land in src/design-system/tamagui.tokens.ts in the next step.
// This file just proves the wiring works end-to-end.
export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  defaultTheme: 'light',
});

export default tamaguiConfig;
