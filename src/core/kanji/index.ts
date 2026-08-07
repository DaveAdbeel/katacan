/**
 * Diccionario de kanji (KANJIDIC2), recortado a solo los caracteres que
 * aparecen en el vocabulario de katacan. Ver scripts/build-kanji.ts.
 */

export interface KanjiInfo {
  /** Lecturas on'yomi, en katakana */
  on: string[]
  /** Lecturas kun'yomi, en hiragana (el punto separa la okurigana, p. ej. "た.べる") */
  kun: string[]
  /** Significados por idioma (en/es/fr/pt; de/it no están en KANJIDIC2) */
  m: Partial<Record<'en' | 'es' | 'fr' | 'pt', string[]>>
  strokes: number | null
  grade: number | null
  jlpt: number | null
}

let cache: Record<string, KanjiInfo> | null = null

export async function loadKanjiDict(): Promise<Record<string, KanjiInfo>> {
  if (cache) return cache
  const mod = (await import('./data.json')) as { default: Record<string, KanjiInfo> }
  cache = mod.default
  return cache
}
