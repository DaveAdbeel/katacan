import { isKatakanaChar } from '../kana'
import type { Script, Word } from './types'

export { WORDS } from './data'
export { CATEGORIES } from './types'
export type { Category, Script, Word } from './types'
export {
  findWordById,
  loadPoolForSource,
  toPoolWordFromBasic,
  toPoolWordFromJlpt,
  wordSource,
} from './poolWord'
export type { PoolWord, WordSource } from './poolWord'

/** Silabario de una palabra, detectado por su primer carácter. */
export function wordScript(word: Word): Script {
  return isKatakanaChar([...word.kana][0]) ? 'katakana' : 'hiragana'
}
