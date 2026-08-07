import { useEffect, useState } from 'react'
import type { LanguageCode } from '../../core/i18n'
import { isKatakanaChar } from '../../core/kana'
import { WORDS, type Category, type Script } from '../../core/words'
import { loadJlptWords, type JlptLevel } from '../../core/words/jlpt'
import { useSettings } from '../settings/SettingsContext'

/** Palabra normalizada para la sesión, venga del set básico o del JLPT. */
export interface PoolWord {
  /** Identificador estable (persiste entre sesiones, para el progreso guardado) */
  id: string
  kana: string
  kanji: string | null
  /** Categoría (set básico) o nivel JLPT, para la etiqueta superior */
  category?: Category
  level?: JlptLevel
  meanings: Partial<Record<LanguageCode, string>> & { en: string }
}

function kanaScript(kana: string): Script {
  return isKatakanaChar([...kana][0]) ? 'katakana' : 'hiragana'
}

/**
 * Lista de palabras que corresponde a los filtros activos (nivel,
 * categorías, silabario). La usan tanto la práctica de escritura como
 * la vista de colección, para que compartan exactamente el mismo pool.
 */
export function useWordPool(): { words: PoolWord[]; loading: boolean } {
  const { settings } = useSettings()
  const { script, categories, level } = settings
  const [state, setState] = useState<{ words: PoolWord[]; loading: boolean }>({
    words: [],
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    setState({ words: [], loading: true })

    const finish = (words: PoolWord[]) => {
      if (cancelled) return
      setState({
        words: words.filter((w) => script === 'both' || kanaScript(w.kana) === script),
        loading: false,
      })
    }

    if (level === 'basic') {
      finish(
        WORDS.filter((w) => categories.includes(w.category)).map((w) => ({
          id: `basic:${w.kana}:${w.kanji ?? ''}`,
          kana: w.kana,
          kanji: w.kanji,
          category: w.category,
          meanings: w.translations,
        })),
      )
    } else {
      loadJlptWords(level).then((entries) =>
        finish(
          entries.map((e) => ({
            id: `${level}:${e.k}:${e.j ?? ''}`,
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
    }
  }, [script, categories, level])

  return state
}
