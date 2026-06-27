'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { PALETTES, getPaletteById, buildCssVars } from '@/lib/palettes'

export type { Palette } from '@/lib/palettes'
export { PALETTES } from '@/lib/palettes'

interface ThemeContextType {
  accentColor: string
  uiTheme: string
  activePaletteId: string
  setAccentColor: (color: string) => void
  setUiTheme: (theme: string) => void
  setPalette: (palette: import('@/lib/palettes').Palette) => void
}

const ThemeContext = createContext<ThemeContextType>({
  accentColor: '#C8FF00',
  uiTheme: 'dark',
  activePaletteId: 'default',
  setAccentColor: () => {},
  setUiTheme: () => {},
  setPalette: () => {},
})

function applyAllCssVars(paletteId: string, accent: string) {
  const palette = getPaletteById(paletteId)
  const vars = buildCssVars(palette, accent)
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
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
    applyAllCssVars(initialPaletteId, initialAccent)
    document.documentElement.setAttribute('data-theme', initialTheme)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setAccentColor = (color: string) => {
    setAccentColorState(color)
    applyAllCssVars(activePaletteId, color)
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

  const setPalette = (palette: import('@/lib/palettes').Palette) => {
    setActivePaletteId(palette.id)
    setAccentColorState(palette.accent)
    applyAllCssVars(palette.id, palette.accent)
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
