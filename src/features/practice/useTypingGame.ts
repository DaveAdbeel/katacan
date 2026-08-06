import { useCallback, useEffect, useRef, useState } from 'react'
import { Matcher, type KanaUnit } from '../../core/kana'
import { WORDS, wordScript, type Word } from '../../core/words'
import { AUTO_ADVANCE_MS } from '../settings/constants'
import { useSettings } from '../settings/SettingsContext'
import { useStats } from '../stats/StatsContext'

interface GameView {
  word: Word | null
  units: KanaUnit[]
  unitIndex: number
  /** Buffer romaji de la unidad en curso */
  buffer: string
  /** Romaji acumulado de toda la palabra; persiste hasta la siguiente */
  romajiTrace: string
  completed: boolean
  revealed: boolean
  awaitingNext: boolean
  /** Contador que se incrementa con cada error (dispara la animación) */
  errorPulse: number
}

const emptyView: GameView = {
  word: null,
  units: [],
  unitIndex: 0,
  buffer: '',
  romajiTrace: '',
  completed: false,
  revealed: false,
  awaitingNext: false,
  errorPulse: 0,
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Estado y acciones de la sesión de práctica: selección de palabras,
 * validación del romaji tecleado y estadísticas.
 */
export function useTypingGame() {
  const { settings } = useSettings()
  const stats = useStats()

  const matcherRef = useRef<Matcher | null>(null)
  const poolRef = useRef<{ items: Word[]; index: number }>({ items: [], index: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hadErrorRef = useRef(false)
  const [view, setView] = useState<GameView>(emptyView)

  const { script, categories } = settings

  const nextWord = useCallback(() => {
    clearTimeout(timerRef.current)
    hadErrorRef.current = false

    const pool = poolRef.current
    if (pool.items.length === 0 || pool.index >= pool.items.length) {
      pool.items = shuffle(
        WORDS.filter(
          (w) => categories.includes(w.category) && (script === 'both' || wordScript(w) === script),
        ),
      )
      pool.index = 0
    }
    const word = pool.items[pool.index] ?? null
    pool.index++

    matcherRef.current = word ? new Matcher(word.kana) : null
    setView((v) => ({
      ...emptyView,
      errorPulse: v.errorPulse,
      word,
      units: matcherRef.current?.units ?? [],
    }))
  }, [script, categories])

  // Nueva palabra al montar y cuando cambian los filtros
  useEffect(() => {
    poolRef.current = { items: [], index: 0 }
    nextWord()
    return () => clearTimeout(timerRef.current)
  }, [nextWord])

  /** Procesa una letra romaji ([a-z] o "-"). */
  const handleChar = (ch: string) => {
    const m = matcherRef.current
    if (!m || m.done) return

    const res = m.input(ch)
    stats.recordKey(res !== 'error')

    if (res === 'error') {
      hadErrorRef.current = true
      setView((v) => ({ ...v, errorPulse: v.errorPulse + 1 }))
      return
    }

    const completed = res === 'complete'
    if (completed) stats.recordWord(!hadErrorRef.current)
    const delay = AUTO_ADVANCE_MS[settings.autoAdvance]
    setView((v) => ({
      ...v,
      unitIndex: m.index,
      buffer: m.buffer,
      romajiTrace: v.romajiTrace + ch,
      completed,
      awaitingNext: completed && delay === 0,
    }))
    if (completed && delay > 0) timerRef.current = setTimeout(nextWord, delay)
  }

  /** Salta la palabra actual (rompe la racha). */
  const skip = () => {
    stats.breakStreak()
    nextWord()
  }

  /** Revela el kana en modo memoria (cuenta como palabra no perfecta). */
  const reveal = () => {
    hadErrorRef.current = true
    setView((v) => ({ ...v, revealed: true }))
  }

  /** Continúa tras completar una palabra en modo manual. */
  const continueNext = () => {
    if (view.awaitingNext) nextWord()
  }

  return { view, handleChar, skip, reveal, continueNext }
}

export type TypingGame = ReturnType<typeof useTypingGame>
