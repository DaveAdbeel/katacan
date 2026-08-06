/**
 * Vocabulario JLPT (N5–N1), generado por scripts/build-jlpt.ts a partir
 * de open-anki-jlpt-decks (MIT). Los significados están en inglés.
 * Cada nivel se carga de forma perezosa como chunk independiente.
 */

export const JLPT_LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'] as const
export type JlptLevel = (typeof JLPT_LEVELS)[number]

export interface JlptEntry {
  /** Lectura en kana (lo que se teclea) */
  k: string
  /** Expresión con kanji, o null si coincide con la lectura */
  j: string | null
  /** Significado en inglés */
  m: string
}

const LOADERS: Record<JlptLevel, () => Promise<{ default: JlptEntry[] }>> = {
  n5: () => import('./jlpt/n5.json') as Promise<{ default: JlptEntry[] }>,
  n4: () => import('./jlpt/n4.json') as Promise<{ default: JlptEntry[] }>,
  n3: () => import('./jlpt/n3.json') as Promise<{ default: JlptEntry[] }>,
  n2: () => import('./jlpt/n2.json') as Promise<{ default: JlptEntry[] }>,
  n1: () => import('./jlpt/n1.json') as Promise<{ default: JlptEntry[] }>,
}

const cache = new Map<JlptLevel, JlptEntry[]>()

export async function loadJlptWords(level: JlptLevel): Promise<JlptEntry[]> {
  const cached = cache.get(level)
  if (cached) return cached
  const entries = (await LOADERS[level]()).default
  cache.set(level, entries)
  return entries
}
