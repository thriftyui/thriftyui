import { useCallback, useEffect, useState } from 'react'
import { useMediaQuery } from 'thriftyui/use-media-query'
import { setDark } from 'thriftyui/set-dark'

// The app's settings, kept in this window's storage: the theme and
// finish, worn on the document's root as the kit's theme reads them
// (kit/src/theme.css): the .dark class, and data-finish.
// public/first-theme.js sets those two before the first paint from the
// same storage.

export type ThemeChoice = 'light' | 'dark' | 'system'
export type FinishChoice = 'metal' | 'none' | 'zebra' | 'leopard' | 'tiger' | 'funfetti' | 'sky' | 'fishtank'
export interface Settings {
  theme: ThemeChoice
  finish: FinishChoice
}

export const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export const FINISHES: { value: FinishChoice; label: string }[] = [
  { value: 'metal', label: 'Metal' },
  { value: 'none', label: 'None' },
  { value: 'zebra', label: 'Zebra' },
  { value: 'leopard', label: 'Leopard' },
  { value: 'tiger', label: 'Tiger' },
  { value: 'funfetti', label: 'Funfetti' },
  { value: 'sky', label: 'Sky' },
  { value: 'fishtank', label: 'Fish tank' },
]

const KEY = 'terminal-and-files-settings'
const DEFAULTS: Settings = { theme: 'system', finish: 'metal' }

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return {
      theme: THEMES.some((t) => t.value === saved.theme) ? saved.theme : DEFAULTS.theme,
      finish: FINISHES.some((f) => f.value === saved.finish) ? saved.finish : DEFAULTS.finish,
    }
  } catch {
    return DEFAULTS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load)
  const system = useMediaQuery('(prefers-color-scheme: dark)')
  const dark = settings.theme === 'system' ? system : settings.theme === 'dark'
  useEffect(() => {
    setDark(dark)
  }, [dark])
  useEffect(() => {
    document.documentElement.dataset.finish = settings.finish
  }, [settings.finish])
  // The same function every render.
  const change = useCallback(
    (next: Partial<Settings>) =>
      setSettings((s) => {
        const merged = { ...s, ...next }
        try {
          localStorage.setItem(KEY, JSON.stringify(merged))
        } catch {
          // Not kept; the choice still holds until the window closes.
        }
        return merged
      }),
    [],
  )
  return [settings, change] as const
}
