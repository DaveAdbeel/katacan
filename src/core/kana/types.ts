/** Tipos del motor romaji → kana. */

export type UnitType = 'normal' | 'sokuon' | 'choon' | 'n'

export interface KanaUnit {
  /** Texto kana de la unidad (1–2 caracteres, p. ej. き o きゃ) */
  text: string
  type: UnitType
  /** Grafías romaji aceptadas para esta unidad */
  romaji: string[]
}

/** Resultado de alimentar una letra al matcher. */
export type InputResult = 'progress' | 'unit' | 'complete' | 'error'
