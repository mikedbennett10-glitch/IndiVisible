import { createContext, useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  isDark: false,
  setMode: () => {},
})

const STORAGE_KEY = 'indivisible-theme'

function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return (stored as ThemeMode) ?? 'system'
  })

  const isDark = mode === 'dark' || (mode === 'system' && getSystemPreference())

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
  }, [])

  // Apply dark class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  // Listen for system preference changes
  useEffect(() => {
    if (mode !== 'system') return

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setModeState('system') // Re-trigger render

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [mode])

  // Update theme-color meta tag
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', isDark ? '#2a231e' : '#a67434')
    }
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
