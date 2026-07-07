'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { PALETTES, getPaletteById, buildCssVars } from '@/lib/palettes'

export type { Palette } from '@/lib/palettes'
export { PALETTES, getPaletteById } from '@/lib/palettes'

interface ThemeContextType {
  accentColor: string
  uiTheme: string
  activePaletteId: string
  bgColor: string
  pendingAccent: string | null
  pendingBg: string | null
  hasPendingChanges: boolean
  setAccentColor: (color: string) => void
  setUiTheme: (theme: string) => void
  setPalette: (palette: import('@/lib/palettes').Palette) => void
  setBgColor: (color: string | null) => void
  setPendingAccent: (color: string) => void
  setPendingBg: (color: string | null) => void
  saveTheme: () => Promise<void>
  discardPending: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  accentColor: '#C8FF00',
  uiTheme: 'dark',
  activePaletteId: 'default',
  bgColor: '#0A0A0F',
  pendingAccent: null,
  pendingBg: null,
  hasPendingChanges: false,
  setAccentColor: () => {},
  setUiTheme: () => {},
  setPalette: () => {},
  setBgColor: () => {},
  setPendingAccent: () => {},
  setPendingBg: () => {},
  saveTheme: async () => {},
  discardPending: () => {},
})

function applyCssVars(paletteId: string, accent: string, bg?: string) {
  const palette = getPaletteById(paletteId)
  const vars = buildCssVars(palette, accent)
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => {
    if (k !== '--bg-primary') root.style.setProperty(k, v)
  })
  if (bg) root.style.setProperty('--bg-primary', bg)
  else root.style.setProperty('--bg-primary', palette.bg)
}

export function ThemeProvider({
  children,
  initialAccent = '#C8FF00',
  initialTheme = 'dark',
  initialPaletteId = 'default',
  initialBg,
}: {
  children: React.ReactNode
  initialAccent?: string
  initialTheme?: string
  initialPaletteId?: string
  initialBg?: string
}) {
  const [accentColor, setAccentColorState] = useState(initialAccent)
  const [uiTheme, setUiThemeState] = useState(initialTheme)
  const [activePaletteId, setActivePaletteId] = useState(initialPaletteId)
  const [bgColor, setBgColorState] = useState<string>(initialBg || getPaletteById(initialPaletteId).bg)

  // Pending changes that haven't been saved to DB yet
  const [pendingAccent, setPendingAccentState] = useState<string | null>(null)
  const [pendingBg, setPendingBgState] = useState<string | null>(null)

  const hasPendingChanges = pendingAccent !== null || pendingBg !== null

  useEffect(() => {
    applyCssVars(initialPaletteId, initialAccent, initialBg)
    document.documentElement.setAttribute('data-theme', initialTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live preview for pending accent
  const setPendingAccent = (color: string) => {
    setPendingAccentState(color)
    applyCssVars(activePaletteId, color, pendingBg || bgColor)
  }

  // Live preview for pending bg
  const setPendingBg = (color: string | null) => {
    setPendingBgState(color)
    const bg = color || bgColor
    document.documentElement.style.setProperty('--bg-primary', bg)
  }

  const discardPending = () => {
    setPendingAccentState(null)
    setPendingBgState(null)
    // Revert to saved
    applyCssVars(activePaletteId, accentColor, bgColor)
  }

  const saveTheme = async () => {
    const newAccent = pendingAccent ?? accentColor
    const newBg = pendingBg ?? bgColor

    // Apply to state
    if (pendingAccent) setAccentColorState(pendingAccent)
    if (pendingBg !== null) setBgColorState(pendingBg ?? bgColor)
    setPendingAccentState(null)
    setPendingBgState(null)

    // Save to DB
    await fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accent_color: newAccent,
        color_palette: activePaletteId,
        custom_bg_color: newBg !== getPaletteById(activePaletteId).bg ? newBg : null,
      }),
    }).catch(() => {})
  }

  // Legacy instant-save setters (for things that don't need pending state)
  const setAccentColor = (color: string) => {
    setAccentColorState(color)
    applyCssVars(activePaletteId, color, bgColor)
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
    setBgColorState(palette.bg)
    setPendingAccentState(null)
    setPendingBgState(null)
    applyCssVars(palette.id, palette.accent, palette.bg)
    fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accent_color: palette.accent,
        color_palette: palette.id,
        custom_bg_color: null,
      }),
    }).catch(() => {})
  }

  const setBgColor = (color: string | null) => {
    const bg = color || getPaletteById(activePaletteId).bg
    setBgColorState(bg)
    document.documentElement.style.setProperty('--bg-primary', bg)
    fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        custom_bg_color: color !== getPaletteById(activePaletteId).bg ? color : null,
      }),
    }).catch(() => {})
  }

  return (
    <ThemeContext.Provider value={{
      accentColor, uiTheme, activePaletteId, bgColor,
      pendingAccent, pendingBg, hasPendingChanges,
      setAccentColor, setUiTheme, setPalette, setBgColor,
      setPendingAccent, setPendingBg, saveTheme, discardPending,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
