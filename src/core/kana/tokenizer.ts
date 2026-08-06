import type { KanaUnit } from './types'
import { BASE, SMALL_KANA, VOWELS, toHiragana } from './romaji'

/**
 * Divide una palabra kana en unidades de escritura, cada una con la
 * lista de grafías romaji aceptadas. Maneja yōon (きゃ), sokuon (っ),
 * chōon (ー) y la ambigüedad de ん.
 */
export function tokenize(word: string): KanaUnit[] {
  const chars = [...word]
  const units: KanaUnit[] = []

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (ch === 'っ' || ch === 'ッ') {
      units.push({ text: ch, type: 'sokuon', romaji: [] })
    } else if (ch === 'ー') {
      units.push({ text: ch, type: 'choon', romaji: [] })
    } else if (ch === 'ん' || ch === 'ン') {
      units.push({ text: ch, type: 'n', romaji: [] })
    } else if (i + 1 < chars.length && SMALL_KANA.includes(chars[i + 1])) {
      units.push({ text: ch + chars[i + 1], type: 'normal', romaji: [] })
      i++
    } else {
      units.push({ text: ch, type: 'normal', romaji: [] })
    }
  }

  // Primera pasada: unidades con romaji propio
  for (const u of units) {
    if (u.type === 'normal') u.romaji = BASE[toHiragana(u.text)] ?? []
  }

  // Segunda pasada: unidades que dependen de la vecina
  units.forEach((u, idx) => {
    const next = units[idx + 1]
    const prev = units[idx - 1]
    if (u.type === 'sokuon') {
      // Consonante inicial duplicada de la siguiente unidad (ッコ → "k")
      const firsts = new Set<string>()
      for (const r of next?.romaji ?? []) {
        const c = r[0]
        if (c && !VOWELS.includes(c) && c !== 'n') firsts.add(c)
      }
      u.romaji = [...firsts, 'ltu', 'xtu', 'ltsu']
    } else if (u.type === 'choon') {
      // Guion o repetición de la vocal anterior (コーヒー → "-" / "o")
      const set = new Set<string>(['-'])
      for (const r of prev?.romaji ?? []) {
        const v = r[r.length - 1]
        if (VOWELS.includes(v)) set.add(v)
      }
      u.romaji = [...set]
    } else if (u.type === 'n') {
      // "nn" siempre; "n" solo si no crea ambigüedad con la unidad siguiente
      const ambiguous = next?.romaji.some(
        (r) => VOWELS.includes(r[0]) || r[0] === 'y' || r[0] === 'n',
      )
      u.romaji = ambiguous ? ['nn'] : ['n', 'nn']
    }
  })

  return units
}
