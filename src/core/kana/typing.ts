import type { KanaUnit } from './types'

export interface TypingState {
  /** Unidades ya completadas correctamente */
  unitIndex: number
  /** Texto sin procesar de la unidad en curso (puede ser inválido) */
  buffer: string
  /** Si `buffer` es o puede llegar a ser una grafía aceptada para la unidad en curso */
  valid: boolean
  /** La palabra entera quedó escrita correctamente, sin cabos sueltos */
  done: boolean
}

/**
 * Evalúa desde cero cuánto de `typed` (todo el romaji tecleado para la
 * palabra, tal cual, incluidos los errores) encaja con las unidades kana
 * de la palabra objetivo.
 *
 * No hay estado mutable ni rechazo de teclas: cualquier letra se puede
 * escribir, y si en algún punto deja de encajar con la unidad en curso,
 * se marca `valid: false` para que la interfaz lo muestre como error,
 * sin bloquear la escritura. El usuario corrige borrando (backspace).
 */
export function evaluateTyping(units: KanaUnit[], typed: string): TypingState {
  let pos = 0
  let unitIndex = 0

  while (unitIndex < units.length) {
    const unit = units[unitIndex]
    const remaining = typed.slice(pos)

    // Grafías ya completamente tecleadas al inicio de lo que queda por leer
    const exactOptions = unit.romaji.filter((r) => remaining.startsWith(r))
    if (exactOptions.length > 0) {
      const longest = exactOptions.reduce((a, b) => (a.length >= b.length ? a : b))
      const longerPending = unit.romaji.some(
        (r) => r.length > longest.length && r.startsWith(remaining),
      )
      // Ambigüedad tipo "n" vs "nn": si aún podría alargarse, espera más
      // teclas (salvo en la última unidad, donde no hay nada que esperar)
      if (remaining.length === longest.length && longerPending && unitIndex < units.length - 1) {
        return { unitIndex, buffer: remaining, valid: true, done: false }
      }
      pos += longest.length
      unitIndex++
      continue
    }

    // Ninguna grafía se completó: ¿lo tecleado es al menos un prefijo válido?
    const isValidPrefix = unit.romaji.some((r) => r.startsWith(remaining))
    return { unitIndex, buffer: remaining, valid: isValidPrefix, done: false }
  }

  return { unitIndex, buffer: '', valid: true, done: true }
}
