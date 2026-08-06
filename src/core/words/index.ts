import { isKatakanaChar } from '../kana'
import type { Script, Word } from './types'

export { WORDS } from './data'
export { CATEGORIES } from './types'
export type { Category, Script, Word } from './types'

/** Silabario de una palabra, detectado por su primer carácter. */
export function wordScript(word: Word): Script {
  return isKatakanaChar([...word.kana][0]) ? 'katakana' : 'hiragana'
}
