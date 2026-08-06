import { detectLanguage } from '../../core/i18n'
import { CATEGORIES } from '../../core/words'
import type { AutoAdvance, Settings } from './types'

export const ACCENTS = [
  '#818cf8', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#f87171', '#e5e7eb',
] as const

/** Retardo del avance automático en ms (0 = manual). */
export const AUTO_ADVANCE_MS: Record<AutoAdvance, number> = {
  off: 0,
  fast: 500,
  normal: 900,
  slow: 1500,
}

export function defaultSettings(): Settings {
  return {
    lang: detectLanguage(),
    script: 'both',
    categories: [...CATEGORIES],
    showKanji: true,
    recallMode: false,
    autoAdvance: 'normal',
    fontScale: 'm',
    accent: ACCENTS[0],
    showRomajiTrace: true,
  }
}
