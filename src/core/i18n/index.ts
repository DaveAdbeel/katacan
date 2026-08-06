import { DICTIONARIES } from './dictionaries'
import { LANGUAGES, type LanguageCode, type UiStrings } from './types'

export { DICTIONARIES } from './dictionaries'
export { LANGUAGES } from './types'
export type { LanguageCode, UiStrings } from './types'

export function isLanguageCode(code: string): code is LanguageCode {
  return (LANGUAGES as readonly string[]).includes(code)
}

/** Idioma inicial: el del navegador si está soportado, si no inglés. */
export function detectLanguage(): LanguageCode {
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2)
  return isLanguageCode(nav) ? nav : 'en'
}

export function getStrings(lang: LanguageCode): UiStrings {
  return DICTIONARIES[lang]
}
