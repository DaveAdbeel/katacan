import type { LanguageCode } from '../../core/i18n'
import type { Category, Script } from '../../core/words'

export type ScriptFilter = 'both' | Script
export type AutoAdvance = 'off' | 'fast' | 'normal' | 'slow'
export type FontScale = 's' | 'm' | 'l'

export interface Settings {
  lang: LanguageCode
  script: ScriptFilter
  categories: Category[]
  showKanji: boolean
  recallMode: boolean
  autoAdvance: AutoAdvance
  fontScale: FontScale
  accent: string
  showRomajiTrace: boolean
}
