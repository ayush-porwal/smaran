// Tamagui v2 nests color/space/size/radius under `tokens` (v1 used top-level keys).
import { createTamagui } from 'tamagui';
import { config as defaultConfig } from '@tamagui/config';

import { bodyFont, headingFont, textVariants } from './tokens/typography';
import { space } from './tokens/spacing';
import { radius } from './tokens/radii';
import { indigo, neutral, semantic } from './tokens/colors';

// Custom theme keys sit alongside Tamagui's required `background` and `color`.
const lightTheme = {
  background: neutral.bgCanvas.light,
  color: neutral.textPrimary.light,

  bgCanvas: neutral.bgCanvas.light,
  bgSurface: neutral.bgSurface.light,
  bgSubtle: neutral.bgSubtle.light,
  bgMuted: neutral.bgMuted.light,

  borderDefault: neutral.borderDefault.light,
  borderStrong: neutral.borderStrong.light,

  textPrimary: neutral.textPrimary.light,
  textSecondary: neutral.textSecondary.light,
  textTertiary: neutral.textTertiary.light,
  textInverse: neutral.textInverse.light,

  accent: indigo[500].light,
  accentHover: indigo[400].light,
  accentPressed: indigo[600].light,
  accentSubtle: indigo[50].light,
  accentText: indigo[700].light,

  success: semantic.success.light,
  warning: semantic.warning.light,
  danger: semantic.danger.light,
  info: semantic.info.light,
};

const darkTheme = {
  background: neutral.bgCanvas.dark,
  color: neutral.textPrimary.dark,

  bgCanvas: neutral.bgCanvas.dark,
  bgSurface: neutral.bgSurface.dark,
  bgSubtle: neutral.bgSubtle.dark,
  bgMuted: neutral.bgMuted.dark,

  borderDefault: neutral.borderDefault.dark,
  borderStrong: neutral.borderStrong.dark,

  textPrimary: neutral.textPrimary.dark,
  textSecondary: neutral.textSecondary.dark,
  textTertiary: neutral.textTertiary.dark,
  textInverse: neutral.textInverse.dark,

  accent: indigo[500].dark,
  accentHover: indigo[400].dark,
  accentPressed: indigo[600].dark,
  accentSubtle: indigo[50].dark,
  accentText: indigo[700].dark,

  success: semantic.success.dark,
  warning: semantic.warning.dark,
  danger: semantic.danger.dark,
  info: semantic.info.dark,
};

export const themes = { light: lightTheme, dark: darkTheme };

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  tokens: {
    ...defaultConfig.tokens,
    color: {
      ...defaultConfig.tokens.color,
      ...lightTheme,
      ...darkTheme,
    },
    space,
    size: space,
    radius,
  },
  themes,
  textVariants,
  media: {
    xs: { maxWidth: 320 },
    sm: { maxWidth: 640 },
    md: { maxWidth: 768 },
    lg: { maxWidth: 1024 },
  },
  defaultTheme: 'light',
});

export default tamaguiConfig;
