import type { InputResult, KanaUnit } from './types'
import { tokenize } from './tokenizer'

/**
 * Matcher incremental: alimenta letra a letra la entrada del usuario
 * (romaji) y avanza por las unidades kana de la palabra objetivo.
 */
export class Matcher {
  readonly units: KanaUnit[]
  index = 0
  buffer = ''
  /** Buffer ya válido, esperando desambiguar (caso "n"/"nn") */
  private pendingMatch: string | null = null

  constructor(word: string) {
    this.units = tokenize(word)
  }

  get done(): boolean {
    return this.index >= this.units.length
  }

  get current(): KanaUnit | undefined {
    return this.units[this.index]
  }

  input(raw: string): InputResult {
    if (this.done) return 'complete'
    const ch = raw.toLowerCase()
    const unit = this.units[this.index]
    const candidate = this.buffer + ch
    const exact = unit.romaji.includes(candidate)
    const prefix = unit.romaji.some(
      (r) => r.length > candidate.length && r.startsWith(candidate),
    )

    if (exact && prefix) {
      // En la última unidad no hay nada que desambiguar: completa ya
      // (p. ej. ほん ← "hon" no debe esperar una segunda "n")
      if (this.index === this.units.length - 1) return this.advance()
      this.buffer = candidate
      this.pendingMatch = candidate
      return 'progress'
    }
    if (exact) return this.advance()
    if (prefix) {
      this.buffer = candidate
      return 'progress'
    }
    // Sin coincidencia: si había un match pendiente, ciérralo y
    // reintenta esta letra contra la siguiente unidad
    if (this.pendingMatch) {
      const res = this.advance()
      if (res === 'complete') return 'complete'
      return this.input(ch)
    }
    return 'error'
  }

  private advance(): InputResult {
    this.buffer = ''
    this.pendingMatch = null
    this.index++
    return this.done ? 'complete' : 'unit'
  }
}
