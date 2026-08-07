import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useLocalStorage } from '../../shared/hooks/useLocalStorage'

/** Mapa de id de palabra -> dominada (escrita sin errores al menos una vez). */
type MasteryMap = Record<string, true>

interface MasteryContextValue {
  isMastered: (id: string) => boolean
  markMastered: (id: string) => void
  masteredCount: number
}

const MasteryContext = createContext<MasteryContextValue | null>(null)

export function MasteryProvider({ children }: { children: ReactNode }) {
  const [mastered, update] = useLocalStorage<MasteryMap>('katacan.mastery', () => ({}))

  const isMastered = useCallback((id: string) => mastered[id] === true, [mastered])
  const markMastered = useCallback(
    (id: string) => {
      if (mastered[id]) return
      update({ [id]: true })
    },
    [mastered, update],
  )

  const value: MasteryContextValue = {
    isMastered,
    markMastered,
    masteredCount: Object.keys(mastered).length,
  }

  return <MasteryContext.Provider value={value}>{children}</MasteryContext.Provider>
}

export function useMastery(): MasteryContextValue {
  const ctx = useContext(MasteryContext)
  if (!ctx) throw new Error('useMastery requiere MasteryProvider')
  return ctx
}
