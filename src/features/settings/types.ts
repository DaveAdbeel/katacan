import type { LanguageCode } from '../../core/i18n'
import type { Category, Script } from '../../core/words'
import type { JlptLevel } from '../../core/words/jlpt'

export type Level = 'basic' | JlptLevel
export type ScriptFilter = 'both' | Script
export type AutoAdvance = 'off' | 'fast' | 'normal' | 'slow'
export type FontScale = 's' | 'm' | 'l'

export interface Settings {
  lang: LanguageCode
  level: Level
  script: ScriptFilter
  categories: Category[]
  showKanji: boolean
  recallMode: boolean
  autoAdvance: AutoAdvance
  fontScale: FontScale
  accent: string
  showRomajiTrace: boolean
}
