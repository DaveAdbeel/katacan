import { createContext, useContext, type ReactNode } from 'react'
import { useLocalStorage } from '../../shared/hooks/useLocalStorage'

export interface Stats {
  words: number
  keysOk: number
  keysBad: number
  streak: number
  bestStreak: number
}

interface StatsContextValue {
  stats: Stats
  /** Precisión acumulada en % (100 si aún no hay teclas) */
  accuracy: number
  recordKey: (correct: boolean) => void
  /** Palabra completada; perfect = sin errores ni revelado */
  recordWord: (perfect: boolean) => void
  breakStreak: () => void
  reset: () => void
}

const initialStats = (): Stats => ({ words: 0, keysOk: 0, keysBad: 0, streak: 0, bestStreak: 0 })

const StatsContext = createContext<StatsContextValue | null>(null)

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, update] = useLocalStorage<Stats>('katacan.stats', initialStats)

  const value: StatsContextValue = {
    stats,
    accuracy:
      stats.keysOk + stats.keysBad > 0
        ? Math.round((stats.keysOk / (stats.keysOk + stats.keysBad)) * 100)
        : 100,
    recordKey: (correct) =>
      update((s) =>
        correct
          ? { ...s, keysOk: s.keysOk + 1 }
          : { ...s, keysBad: s.keysBad + 1, streak: 0 },
      ),
    recordWord: (perfect) =>
      update((s) => {
        const streak = perfect ? s.streak + 1 : s.streak
        return {
          ...s,
          words: s.words + 1,
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
        }
      }),
    breakStreak: () => update({ streak: 0 }),
    reset: () => update(() => initialStats()),
  }

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>
}

export function useStats(): StatsContextValue {
  const ctx = useContext(StatsContext)
  if (!ctx) throw new Error('useStats requiere StatsProvider')
  return ctx
}
