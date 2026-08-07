import { useEffect, useRef, useState } from 'react'
import { evaluateTyping, tokenize, type KanaUnit } from '../../core/kana'
import { useMastery } from '../mastery/MasteryContext'
import { AUTO_ADVANCE_MS } from '../settings/constants'
import { useSettings } from '../settings/SettingsContext'
import { useStats } from '../stats/StatsContext'
import { useWordPool, type PoolWord } from './useWordPool'

interface GameView {
  word: PoolWord | null
  units: KanaUnit[]
  unitIndex: number
  /** Todo el romaji tecleado para esta palabra, tal cual (incluye errores) */
  typed: string
  /** Cola de la unidad en curso (puede ser inválida) */
  buffer: string
  /** Si `buffer` es una grafía válida (en curso) o ya no encaja con nada */
  bufferValid: boolean
  completed: boolean
  revealed: boolean
  awaitingNext: boolean
  loading: boolean
  /** Contador que se incrementa con cada error (dispara la animación) */
  errorPulse: number
}

const emptyView: GameView = {
  word: null,
  units: [],
  unitIndex: 0,
  typed: '',
  buffer: '',
  bufferValid: true,
  completed: false,
  revealed: false,
  awaitingNext: false,
  loading: true,
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
 * Estado y acciones de la sesión de práctica: recorre el pool de
 * palabras al azar y valida el romaji tecleado contra la palabra
 * actual. La escritura nunca se bloquea: cualquier tecla se acepta y
 * se muestra, marcada como error si no encaja; se corrige con
 * backspace, igual que en un campo de texto normal.
 */
export function useTypingGame() {
  const { settings } = useSettings()
  const stats = useStats()
  const mastery = useMastery()
  const { words, loading: poolLoading } = useWordPool()

  const queueRef = useRef<{ items: PoolWord[]; index: number }>({ items: [], index: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hadErrorRef = useRef(false)
  const [view, setView] = useState<GameView>(emptyView)

  const nextWord = () => {
    clearTimeout(timerRef.current)
    hadErrorRef.current = false

    const queue = queueRef.current
    if (queue.items.length === 0 || queue.index >= queue.items.length) {
      queue.items = shuffle(words)
      queue.index = 0
    }
    const word = queue.items[queue.index] ?? null
    queue.index++

    setView((v) => ({
      ...emptyView,
      loading: false,
      errorPulse: v.errorPulse,
      word,
      units: word ? tokenize(word.kana) : [],
    }))
  }
  const nextWordRef = useRef(nextWord)
  nextWordRef.current = nextWord

  // Nueva palabra cuando el pool cambia (nivel, categorías o silabario)
  useEffect(() => {
    queueRef.current = { items: [], index: 0 }
    if (poolLoading) {
      setView((v) => ({ ...emptyView, errorPulse: v.errorPulse, loading: true }))
    } else {
      nextWordRef.current()
    }
    return () => clearTimeout(timerRef.current)
  }, [words, poolLoading])

  /** Aplica una nueva cadena de romaji tecleado y sincroniza el estado. */
  const apply = (newTyped: string, isDeletion: boolean) => {
    if (!view.word || view.completed) return
    const result = evaluateTyping(view.units, newTyped)

    if (!isDeletion) {
      stats.recordKey(result.valid)
      if (!result.valid) hadErrorRef.current = true
    }

    if (result.done) {
      stats.recordWord(!hadErrorRef.current)
      if (!hadErrorRef.current) mastery.markMastered(view.word.id)
      const delay = AUTO_ADVANCE_MS[settings.autoAdvance]
      setView((v) => ({
        ...v,
        typed: newTyped,
        unitIndex: result.unitIndex,
        buffer: '',
        bufferValid: true,
        completed: true,
        awaitingNext: delay === 0,
        errorPulse: !isDeletion && !result.valid ? v.errorPulse + 1 : v.errorPulse,
      }))
      if (delay > 0) timerRef.current = setTimeout(() => nextWordRef.current(), delay)
    } else {
      setView((v) => ({
        ...v,
        typed: newTyped,
        unitIndex: result.unitIndex,
        buffer: result.buffer,
        bufferValid: result.valid,
        errorPulse: !isDeletion && !result.valid ? v.errorPulse + 1 : v.errorPulse,
      }))
    }
  }

  /** Procesa una letra romaji ([a-z] o "-"). Nunca se rechaza. */
  const handleChar = (ch: string) => apply(view.typed + ch, false)

  /** Borra la última letra tecleada, para corregir un error. */
  const backspace = () => {
    if (!view.typed) return
    apply(view.typed.slice(0, -1), true)
  }

  /** Salta la palabra actual (rompe la racha). */
  const skip = () => {
    if (!view.word || view.completed) return
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

  return { view, handleChar, backspace, skip, reveal, continueNext }
}

export type TypingGame = ReturnType<typeof useTypingGame>
