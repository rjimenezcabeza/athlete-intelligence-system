'use client'

import { createContext, useContext, useEffect, useState } from 'react'

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

interface ThemeContextType {
  accentColor: string
  uiTheme: string
  activePaletteId: string
  setAccentColor: (color: string) => void
  setUiTheme: (theme: string) => void
  setPalette: (palette: Palette) => void
}

const ThemeContext = createContext<ThemeContextType>({
  accentColor: '#C8FF00',
  uiTheme: 'dark',
  activePaletteId: 'default',
  setAccentColor: () => {},
  setUiTheme: () => {},
  setPalette: () => {},
})

function applyPaletteCssVars(palette: Palette) {
  const root = document.documentElement
  root.style.setProperty('--accent-color', palette.accent)
  root.style.setProperty('--accent-bg', `${palette.accent}12`)
  root.style.setProperty('--accent-border', `${palette.accent}30`)
  root.style.setProperty('--bg-primary', palette.bg)
  root.style.setProperty('--card-bg', palette.card)
  root.style.setProperty('--card-border', palette.cardBorder)
  root.style.setProperty('--text-primary', palette.textPrimary)
  root.style.setProperty('--text-secondary', palette.textSecondary)
  root.style.setProperty('--text-tertiary', palette.textTertiary)
}

function applyAccent(color: string) {
  document.documentElement.style.setProperty('--accent-color', color)
  document.documentElement.style.setProperty('--accent-bg', `${color}12`)
  document.documentElement.style.setProperty('--accent-border', `${color}30`)
}

export function ThemeProvider({
  children,
  initialAccent = '#C8FF00',
  initialTheme = 'dark',
  initialPaletteId = 'default',
}: {
  children: React.ReactNode
  initialAccent?: string
  initialTheme?: string
  initialPaletteId?: string
}) {
  const [accentColor, setAccentColorState] = useState(initialAccent)
  const [uiTheme, setUiThemeState] = useState(initialTheme)
  const [activePaletteId, setActivePaletteId] = useState(initialPaletteId)

  useEffect(() => {
    // Apply initial palette or just accent
    const palette = PALETTES.find(p => p.id === initialPaletteId)
    if (palette) {
      applyPaletteCssVars({ ...palette, accent: initialAccent || palette.accent })
    } else {
      applyAccent(initialAccent)
    }
    document.documentElement.setAttribute('data-theme', initialTheme)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setAccentColor = (color: string) => {
    setAccentColorState(color)
    applyAccent(color)
    fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accent_color: color }),
    }).catch(() => {})
  }

  const setUiTheme = (theme: string) => {
    setUiThemeState(theme)
    document.documentElement.setAttribute('data-theme', theme)
    fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ui_theme: theme }),
    }).catch(() => {})
  }

  const setPalette = (palette: Palette) => {
    setActivePaletteId(palette.id)
    setAccentColorState(palette.accent)
    applyPaletteCssVars(palette)
    fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accent_color: palette.accent,
        color_palette: palette.id,
      }),
    }).catch(() => {})
  }

  return (
    <ThemeContext.Provider value={{ accentColor, uiTheme, activePaletteId, setAccentColor, setUiTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
