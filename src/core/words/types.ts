import type { LanguageCode } from '../i18n/types'

export const CATEGORIES = [
  'animals', 'food', 'nature', 'body', 'family', 'time',
  'colors', 'objects', 'places', 'verbs', 'adjectives',
] as const

export type Category = (typeof CATEGORIES)[number]

export type Script = 'hiragana' | 'katakana'

export interface Word {
  /** Palabra en kana (hiragana o katakana) */
  kana: string
  /** Kanji, o null para préstamos sin kanji habitual */
  kanji: string | null
  category: Category
  /** Traducciones por idioma */
  translations: Record<LanguageCode, string>
}
