export interface Palette {
  id: string
  name: string
  accent: string
  bg: string
  card: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
}

export const PALETTES: Palette[] = [
  {
    id: 'default',
    name: 'AIS Classic',
    accent: '#C8FF00',
    bg: '#0A0A0F',
    card: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.07)',
    textPrimary: '#dddddd',
    textSecondary: '#888888',
    textTertiary: '#444444',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    accent: '#00D4FF',
    bg: '#060D14',
    card: 'rgba(0,212,255,0.03)',
    cardBorder: 'rgba(0,212,255,0.08)',
    textPrimary: '#e8f4f8',
    textSecondary: '#6a8fa0',
    textTertiary: '#2a4a5a',
  },
  {
    id: 'ember',
    name: 'Ember',
    accent: '#FF6B35',
    bg: '#0F0804',
    card: 'rgba(255,107,53,0.04)',
    cardBorder: 'rgba(255,107,53,0.1)',
    textPrimary: '#fff5f0',
    textSecondary: '#9a6a5a',
    textTertiary: '#4a2a1a',
  },
  {
    id: 'forest',
    name: 'Forest',
    accent: '#10B981',
    bg: '#060F08',
    card: 'rgba(16,185,129,0.03)',
    cardBorder: 'rgba(16,185,129,0.08)',
    textPrimary: '#f0fff4',
    textSecondary: '#4a8060',
    textTertiary: '#1a4030',
  },
  {
    id: 'violet',
    name: 'Violet',
    accent: '#A855F7',
    bg: '#080613',
    card: 'rgba(168,85,247,0.04)',
    cardBorder: 'rgba(168,85,247,0.1)',
    textPrimary: '#f5f0ff',
    textSecondary: '#7a5a9a',
    textTertiary: '#3a1a5a',
  },
]

export function getPaletteById(id: string): Palette {
  return PALETTES.find(p => p.id === id) ?? PALETTES[0]
}

export function buildCssVars(palette: Palette, accentOverride?: string) {
  const accent = accentOverride || palette.accent
  return {
    '--accent-color': accent,
    '--accent-bg': `${accent}12`,
    '--accent-border': `${accent}30`,
    '--bg-primary': palette.bg,
    '--card-bg': palette.card,
    '--card-border': palette.cardBorder,
    '--text-primary': palette.textPrimary,
    '--text-secondary': palette.textSecondary,
    '--text-tertiary': palette.textTertiary,
  }
}
