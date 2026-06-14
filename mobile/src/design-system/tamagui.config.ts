// Tamagui config. Wires our tokens into a Tamagui config object and
// defines light/dark themes. The themes here are the SINGLE source of
// truth for every color the app uses; component code references keys
// like `backgroundColor="$bgSurface"` and never hardcodes hex values.
import { createTamagui } from 'tamagui';

import { bodyFont, headingFont, textVariants } from './tokens/typography';
import { space } from './tokens/spacing';
import { radius } from './tokens/radii';
import { indigo, neutral, semantic } from './tokens/colors';

const lightTheme = {
  // Surfaces
  bgCanvas: neutral.bgCanvas.light,
  bgSurface: neutral.bgSurface.light,
  bgSubtle: neutral.bgSubtle.light,
  bgMuted: neutral.bgMuted.light,

  // Borders
  borderDefault: neutral.borderDefault.light,
  borderStrong: neutral.borderStrong.light,

  // Text
  textPrimary: neutral.textPrimary.light,
  textSecondary: neutral.textSecondary.light,
  textTertiary: neutral.textTertiary.light,
  textInverse: neutral.textInverse.light,

  // Accent + semantic
  accent: indigo[500].light,
  accentHover: indigo[400].light,
  accentPressed: indigo[600].light,
  accentSubtle: indigo[50].light,
  accentText: indigo[700].light,
  success: semantic.success.light,
  warning: semantic.warning.light,
  danger: semantic.danger.light,
  info: semantic.info.light,

  // Tamagui-required keys: `background` and `color` are read by Tamagui
  // primitives that fall back to defaults.
  background: neutral.bgCanvas.light,
  color: neutral.textPrimary.light,
};

const darkTheme = {
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

  background: neutral.bgCanvas.dark,
  color: neutral.textPrimary.dark,
};

export const themes = { light: lightTheme, dark: darkTheme };

export const tamaguiConfig = createTamagui({
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  // Size tokens. Re-exported for components that want `size="$5"`.
  size: space,
  // Space tokens for padding/gap/margin props (`$4` = 16).
  space,
  // Radius tokens for `borderRadius="$md"`.
  radius,
  // Theme color maps. `lightTheme` / `darkTheme` are spread into the
  // config directly so Tamagui picks them up alongside `themes`.
  ...lightTheme,
  ...darkTheme,
  themes,
  // Reusable text variants. `<Text variant="body.md" />` resolves these.
  textVariants,
  // Media query breakpoints. Phone is the only target in Phase 0;
  // tablet/desktop are placeholders for later.
  media: {
    xs: { maxWidth: 320 },
    sm: { maxWidth: 640 },
    md: { maxWidth: 768 },
    lg: { maxWidth: 1024 },
  },
  // Default scheme when no override is set.
  defaultTheme: 'light',
});

export default tamaguiConfig;
