// Dark values are lifted so the same perceived weight reads on near-black backgrounds.
export const indigo = {
  50: { light: '#EEF0FF', dark: '#1A1B3A' },
  100: { light: '#DCE0FF', dark: '#252754' },
  200: { light: '#B8C0FF', dark: '#3A3D7A' },
  300: { light: '#8E99FF', dark: '#5256A8' },
  400: { light: '#6B72F4', dark: '#6B72F4' },
  500: { light: '#5B5FE9', dark: '#7C7FFF' },
  600: { light: '#4845C7', dark: '#9A9DFF' },
  700: { light: '#36339E', dark: '#B8BBFF' },
  800: { light: '#252574', dark: '#D4D6FF' },
  900: { light: '#15164A', dark: '#E8EAFF' },
} as const;

export const neutral = {
  bgCanvas: { light: '#FAFAFA', dark: '#0A0A0A' },
  bgSurface: { light: '#FFFFFF', dark: '#131316' },
  bgSubtle: { light: '#F4F4F5', dark: '#1C1C20' },
  bgMuted: { light: '#E4E4E7', dark: '#27272A' },
  borderDefault: { light: '#E4E4E7', dark: '#27272A' },
  borderStrong: { light: '#D4D4D8', dark: '#3F3F46' },
  textPrimary: { light: '#0A0A0A', dark: '#FAFAFA' },
  textSecondary: { light: '#52525B', dark: '#A1A1AA' },
  textTertiary: { light: '#A1A1AA', dark: '#71717A' },
  textInverse: { light: '#FAFAFA', dark: '#0A0A0A' },
  // Foreground on saturated fills (accent/danger buttons, FABs).
  onAccent: { light: '#FFFFFF', dark: '#FFFFFF' },
  onDanger: { light: '#FFFFFF', dark: '#FFFFFF' },
} as const;

// User-selectable group avatar colors (matches GraphQL GroupColor enum).
export const group = {
  indigo: { light: '#5B5FE9', dark: '#7C7FFF' },
  violet: { light: '#7C3AED', dark: '#8B5CF6' },
  rose: { light: '#F43F5E', dark: '#FB7185' },
  amber: { light: '#F59E0B', dark: '#FBBF24' },
  emerald: { light: '#10B981', dark: '#34D399' },
  sky: { light: '#0EA5E9', dark: '#38BDF8' },
} as const;

export const semantic = {
  success: { light: '#16A34A', dark: '#22C55E' },
  warning: { light: '#D97706', dark: '#F59E0B' },
  danger: { light: '#DC2626', dark: '#EF4444' },
  info: { light: '#0284C7', dark: '#38BDF8' },
} as const;

export type IndigoToken = keyof typeof indigo;
export type NeutralToken = keyof typeof neutral;
export type GroupColorToken = keyof typeof group;
export type SemanticToken = keyof typeof semantic;
