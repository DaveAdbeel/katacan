import { describe, expect, it } from 'vitest'
import { tokenize } from '../../kana'
import { JLPT_LEVELS, loadJlptWords } from '../jlpt'

describe('vocabulario JLPT', () => {
  it.each(JLPT_LEVELS)('todas las palabras de %s se pueden teclear', async (level) => {
    const entries = await loadJlptWords(level)
    expect(entries.length).toBeGreaterThan(500)
    for (const e of entries) {
      const units = tokenize(e.k)
      expect(units.length, e.k).toBeGreaterThan(0)
      for (const u of units) {
        expect(u.romaji.length, `${e.k} — unidad ${u.text}`).toBeGreaterThan(0)
      }
    }
  })
})
