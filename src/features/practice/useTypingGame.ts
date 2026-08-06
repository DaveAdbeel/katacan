import { useEffect, useRef, useState } from 'react'
import type { LanguageCode } from '../../core/i18n'
import { Matcher, isKatakanaChar, type KanaUnit } from '../../core/kana'
import { WORDS, type Category, type Script } from '../../core/words'
import { loadJlptWords, type JlptLevel } from '../../core/words/jlpt'
import { AUTO_ADVANCE_MS } from '../settings/constants'
import { useSettings } from '../settings/SettingsContext'
import { useStats } from '../stats/StatsContext'

/** Palabra normalizada para la sesión, venga del set básico o del JLPT. */
export interface PoolWord {
  kana: string
  kanji: string | null
  /** Categoría (set básico) o nivel JLPT, para la etiqueta superior */
  category?: Category
  level?: JlptLevel
  meanings: Partial<Record<LanguageCode, string>> & { en: string }
}

interface GameView {
  word: PoolWord | null
  units: KanaUnit[]
  unitIndex: number
  /** Buffer romaji de la unidad en curso */
  buffer: string
  /** Romaji acumulado de toda la palabra; persiste hasta la siguiente */
  romajiTrace: string
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
  buffer: '',
  romajiTrace: '',
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

function kanaScript(kana: string): Script {
  return isKatakanaChar([...kana][0]) ? 'katakana' : 'hiragana'
}

/**
 * Estado y acciones de la sesión de práctica: selección de palabras
 * (set básico o niveles JLPT cargados de forma perezosa), validación
 * del romaji tecleado y estadísticas.
 */
export function useTypingGame() {
  const { settings } = useSettings()
  const stats = useStats()

  const matcherRef = useRef<Matcher | null>(null)
  /** Lista filtrada completa de la que se rellena la cola barajada */
  const sourceRef = useRef<PoolWord[]>([])
  const queueRef = useRef<{ items: PoolWord[]; index: number }>({ items: [], index: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hadErrorRef = useRef(false)
  const [view, setView] = useState<GameView>(emptyView)

  const { script, categories, level } = settings

  const nextWord = () => {
    clearTimeout(timerRef.current)
    hadErrorRef.current = false

    const queue = queueRef.current
    if (queue.items.length === 0 || queue.index >= queue.items.length) {
      queue.items = shuffle(sourceRef.current)
      queue.index = 0
    }
    const word = queue.items[queue.index] ?? null
    queue.index++

    matcherRef.current = word ? new Matcher(word.kana) : null
    setView((v) => ({
      ...emptyView,
      loading: false,
      errorPulse: v.errorPulse,
      word,
      units: matcherRef.current?.units ?? [],
    }))
  }
  const nextWordRef = useRef(nextWord)
  nextWordRef.current = nextWord

  // Carga la fuente de palabras al montar y cuando cambian los filtros
  useEffect(() => {
    let cancelled = false
    setView((v) => ({ ...emptyView, errorPulse: v.errorPulse, loading: true }))

    const start = (words: PoolWord[]) => {
      if (cancelled) return
      sourceRef.current = words.filter((w) => script === 'both' || kanaScript(w.kana) === script)
      queueRef.current = { items: [], index: 0 }
      nextWordRef.current()
    }

    if (level === 'basic') {
      start(
        WORDS.filter((w) => categories.includes(w.category)).map((w) => ({
          kana: w.kana,
          kanji: w.kanji,
          category: w.category,
          meanings: w.translations,
        })),
      )
    } else {
      loadJlptWords(level).then((entries) =>
        start(
          entries.map((e) => ({
            kana: e.k,
            kanji: e.j,
            level,
            meanings: e.s ? { en: e.m, es: e.s } : { en: e.m },
          })),
        ),
      )
    }

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
    }
  }, [script, categories, level])

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
    if (completed && delay > 0) timerRef.current = setTimeout(() => nextWordRef.current(), delay)
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

  return { view, handleChar, skip, reveal, continueNext }
}

export type TypingGame = ReturnType<typeof useTypingGame>
