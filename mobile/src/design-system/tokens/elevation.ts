// Elevation uses both shadows and borders depending on mode. In light
// mode we lean on subtle shadows; in dark mode shadows are reserved for
// the top two levels and lower elevations get a hairline border instead.
export const elevationLight = {
  0: 'none',
  1: '0 1px 0 0 #E4E4E7',
  2: '0 1px 2px rgba(0,0,0,0.04), 0 1px 0 0 #E4E4E7',
  3: '0 4px 12px rgba(0,0,0,0.08), 0 1px 0 0 #E4E4E7',
  4: '0 12px 32px rgba(0,0,0,0.12)',
} as const;

export const elevationDark = {
  0: 'none',
  1: '0 0 0 1px #27272A',
  2: '0 0 0 1px #3F3F46',
  3: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px #27272A',
  4: '0 16px 48px rgba(0,0,0,0.5)',
} as const;

export type ElevationToken = keyof typeof elevationLight;
