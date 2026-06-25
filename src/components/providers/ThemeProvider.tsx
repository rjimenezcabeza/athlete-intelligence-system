'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  accentColor: string
  uiTheme: string
  setAccentColor: (color: string) => void
  setUiTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  accentColor: '#C8FF00',
  uiTheme: 'dark',
  setAccentColor: () => {},
  setUiTheme: () => {}
})

function applyAccent(color: string) {
  document.documentElement.style.setProperty('--accent-color', color)
  document.documentElement.style.setProperty('--accent-bg', `${color}12`)
  document.documentElement.style.setProperty('--accent-border', `${color}30`)
}

export function ThemeProvider({
  children,
  initialAccent = '#C8FF00',
  initialTheme = 'dark'
}: {
  children: React.ReactNode
  initialAccent?: string
  initialTheme?: string
}) {
  const [accentColor, setAccentColorState] = useState(initialAccent)
  const [uiTheme, setUiThemeState] = useState(initialTheme)

  useEffect(() => {
    applyAccent(accentColor)
    document.documentElement.setAttribute('data-theme', uiTheme)
  }, [accentColor, uiTheme])

  const setAccentColor = (color: string) => {
    setAccentColorState(color)
    applyAccent(color)
    fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accent_color: color })
    }).catch(() => {})
  }

  const setUiTheme = (theme: string) => {
    setUiThemeState(theme)
    document.documentElement.setAttribute('data-theme', theme)
    fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ui_theme: theme })
    }).catch(() => {})
  }

  return (
    <ThemeContext.Provider value={{ accentColor, uiTheme, setAccentColor, setUiTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
