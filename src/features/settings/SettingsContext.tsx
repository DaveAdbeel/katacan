import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { getStrings, type UiStrings } from '../../core/i18n'
import { useLocalStorage } from '../../shared/hooks/useLocalStorage'
import { defaultSettings } from './constants'
import type { Settings } from './types'

interface SettingsContextValue {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  /** Textos de interfaz en el idioma activo */
  t: UiStrings
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, update] = useLocalStorage<Settings>('katacan.settings', defaultSettings)

  // El color de acento vive como variable CSS para poder usarse en cualquier estilo
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accent)
  }, [settings.accent])

  const value: SettingsContextValue = {
    settings,
    update,
    t: getStrings(settings.lang),
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings requiere SettingsProvider')
  return ctx
}
