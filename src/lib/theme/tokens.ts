/**
 * Shared MoveThisOut design tokens — web CSS vars + RN-friendly JS mirror.
 * Keep values identical across all apps (DoorDash/inDrive-style yellow accent).
 */
export const colors = {
  accent: '#FFDE2E',
  ink: '#0E0E10',
  surface: '#FFFFFF',
  canvas: '#F5F4EF',
  border: 'rgba(0,0,0,0.10)',
  borderStrong: 'rgba(0,0,0,0.16)',
  textPrimary: '#0E0E10',
  textSecondary: '#6B6B70',
  textTertiary: '#8A8A90',
  success: '#146E46',
  successSurface: '#E7F5EE',
  warning: '#965F0A',
  warningSurface: '#FDF3E1',
  danger: '#C23B3B',
  dangerSurface: '#FBEAEA',
} as const;

export const fonts = {
  display: "var(--font-archivo), system-ui, sans-serif",
  body: "var(--font-hanken), system-ui, sans-serif",
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const motion = {
  fast: '140ms',
  base: '220ms',
  slow: '320ms',
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

export const theme = { colors, fonts, radii, spacing, motion } as const;
export default theme;
