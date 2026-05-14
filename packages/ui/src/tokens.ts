// ─── Color: Brand ────────────────────────────────────────────────────────────

export const forest = {
  900: '#0F1F18',
  800: '#142B22',
  700: '#1B3A2D',
  600: '#2A5141',
  500: '#3D6B57',
  400: '#5C8A75',
  300: '#8FAD9F',
  200: '#C2D1C8',
  100: '#E2EAE5',
  50:  '#F1F5F2',
} as const

export const sage = {
  700: '#5C6B5A',
  500: '#8A9786',
  300: '#B6BFB1',
  100: '#DDE2D8',
} as const

export const court = {
  700: '#8FA02E',
  500: '#B8C840',
  400: '#C9D26A',
  300: '#DCE393',
  200: '#EAEFB8',
  100: '#F4F6DC',
} as const

export const sand = {
  50:  '#FAF8F2',
  100: '#F5F2EC',
  200: '#ECE7DA',
  300: '#DDD6C2',
  400: '#C4BCA4',
  500: '#A39A82',
  600: '#7A7361',
} as const

export const chalk = '#FEFCF7'
export const ink   = '#0F1F18'

// ─── Color: Semantic ──────────────────────────────────────────────────────────

export const semantic = {
  success:   '#4F8A5C',
  successBg: '#E5F0E7',
  warning:   '#C8923B',
  warningBg: '#F8EBD2',
  danger:    '#B5483A',
  dangerBg:  '#F4DCD7',
  info:      '#4A7A8C',
  infoBg:    '#DDEAEF',
} as const

// ─── Themes ───────────────────────────────────────────────────────────────────

export const theme = {
  bg:        sand[50],
  bgElevated: chalk,
  bgSunken:  sand[100],
  bgInverse: forest[900],

  fg:        forest[900],
  fgMuted:   forest[600],
  fgSubtle:  sage[700],
  fgFaint:   sand[500],
  fgOnDark:  sand[50],
  fgOnAccent: forest[900],

  border:       sand[300],
  borderStrong: sand[400],
  borderSubtle: sand[200],

  accent:      court[500],
  accentHover: court[400],
  accentPress: court[700],

  primary:      forest[700],
  primaryHover: forest[600],
  primaryPress: forest[800],

  ...semantic,
} as const

export const kidTheme = {
  ...theme,
  primary:      court[700],
  primaryHover: court[500],
  primaryPress: '#6E7D24',
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const fontSize = {
  xs:   12,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
  '5xl': 60,
  '6xl': 76,
} as const

export const kidFontSize = {
  ...fontSize,
  base: 17,
  md:   19,
  lg:   23,
  xl:   28,
  '2xl': 34,
  '3xl': 44,
  '4xl': 56,
} as const

export const lineHeight = {
  tight:   1.1,
  snug:    1.25,
  normal:  1.5,
  relaxed: 1.65,
} as const

export const fontWeight = {
  regular: '400',
  medium:  '500',
  semi:    '600',
  bold:    '700',
  black:   '800',
} as const

export const letterSpacing = {
  tight:   -0.3,  // ~-0.02em at 15px base
  normal:  0,
  wide:    0.6,   // ~0.04em
  eyebrow: 1.8,   // ~0.12em
} as const

// ─── Spacing (4px base) ───────────────────────────────────────────────────────

export const spacing = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const

// ─── Radii ────────────────────────────────────────────────────────────────────

export const radius = {
  xs:   4,
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  '2xl': 28,
  pill: 999,
} as const

export const kidRadius = {
  ...radius,
  md:   14,
  lg:   20,
  xl:   28,
  '2xl': 36,
} as const

// ─── Motion ───────────────────────────────────────────────────────────────────

export const duration = {
  fast: 120,
  base: 200,
  slow: 320,
} as const
