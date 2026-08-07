import type { LanguageCode } from '../i18n'
import { WORDS } from './data'
import type { Category, Word } from './types'
import { JLPT_LEVELS, loadJlptWords, type JlptEntry, type JlptLevel } from './jlpt'

/** Palabra normalizada, venga del set básico o de un nivel JLPT. */
export interface PoolWord {
  /**
   * Identificador estable: `${fuente}:${kana}:${kanji}`, con fuente
   * "basic" o un nivel JLPT. Ni el kana ni el kanji contienen ":", así
   * que `id.split(':')` siempre da exactamente 3 partes.
   */
  id: string
  kana: string
  kanji: string | null
  /** Categoría (set básico) o nivel JLPT, para la etiqueta superior */
  category?: Category
  level?: JlptLevel
  meanings: Partial<Record<LanguageCode, string>> & { en: string }
}

/** Fuente de una palabra: el set básico o el nivel JLPT al que pertenece. */
export type WordSource = 'basic' | JlptLevel

export function wordSource(word: PoolWord): WordSource {
  return word.level ?? 'basic'
}

function wordId(source: WordSource, kana: string, kanji: string | null): string {
  return `${source}:${kana}:${kanji ?? ''}`
}

export function toPoolWordFromBasic(w: Word): PoolWord {
  return {
    id: wordId('basic', w.kana, w.kanji),
    kana: w.kana,
    kanji: w.kanji,
    category: w.category,
    meanings: w.translations,
  }
}

export function toPoolWordFromJlpt(level: JlptLevel, e: JlptEntry): PoolWord {
  return {
    id: wordId(level, e.k, e.j),
    kana: e.k,
    kanji: e.j,
    level,
    meanings: e.s ? { en: e.m, es: e.s } : { en: e.m },
  }
}

/** Todas las palabras de una fuente (set básico o un nivel JLPT), tal cual. */
export async function loadPoolForSource(source: WordSource): Promise<PoolWord[]> {
  if (source === 'basic') return WORDS.map(toPoolWordFromBasic)
  const entries = await loadJlptWords(source)
  return entries.map((e) => toPoolWordFromJlpt(source, e))
}

/**
 * Busca una palabra por su id, sin depender de los ajustes activos:
 * carga la fuente que corresponda (el set básico ya está en memoria,
 * un nivel JLPT se carga bajo demanda) y encuentra la coincidencia
 * exacta. Pensado para páginas enlazables (rutas /word/:id).
 */
export async function findWordById(id: string): Promise<PoolWord | null> {
  const [source, kana, kanjiRaw] = id.split(':')
  const kanji = kanjiRaw || null
  if (!source || !kana) return null

  const isJlpt = (JLPT_LEVELS as readonly string[]).includes(source)
  if (source !== 'basic' && !isJlpt) return null

  const words = await loadPoolForSource(source as WordSource)
  return words.find((w) => w.kana === kana && w.kanji === kanji) ?? null
}
