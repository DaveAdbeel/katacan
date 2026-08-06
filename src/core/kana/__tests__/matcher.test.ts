import { describe, expect, it } from 'vitest'
import { Matcher, tokenize } from '..'
import { WORDS } from '../../words'

function typeWord(word: string, romaji: string): boolean {
  const m = new Matcher(word)
  for (const ch of romaji) {
    if (m.input(ch) === 'error') return false
  }
  return m.done
}

describe('Matcher', () => {
  it.each([
    ['ねこ', 'neko'],
    ['みず', 'mizu'],
    ['し', 'shi'],
    ['し', 'si'],
    ['つき', 'tsuki'],
    ['つき', 'tuki'],
    ['ふゆ', 'fuyu'],
    ['ふゆ', 'huyu'],
  ])('acepta grafías básicas: %s ← %s', (word, romaji) => {
    expect(typeWord(word, romaji)).toBe(true)
  })

  it.each([
    ['きょう', 'kyou'],
    ['でんしゃ', 'densha'],
    ['でんしゃ', 'densya'],
    ['チョコレート', 'chokore-to'],
    ['チョコレート', 'chokoreeto'],
    ['ジュース', 'ju-su'],
    ['ジュース', 'juusu'],
  ])('acepta yōon: %s ← %s', (word, romaji) => {
    expect(typeWord(word, romaji)).toBe(true)
  })

  it.each([
    ['がっこう', 'gakkou'],
    ['ベッド', 'beddo'],
    ['サッカー', 'sakka-'],
    ['サッカー', 'sakkaa'],
  ])('acepta sokuon: %s ← %s', (word, romaji) => {
    expect(typeWord(word, romaji)).toBe(true)
  })

  it.each([
    ['コーヒー', 'ko-hi-'],
    ['コーヒー', 'koohii'],
    ['スープ', 'su-pu'],
    ['ケーキ', 'ke-ki'],
    ['タクシー', 'takushi-'],
    ['タクシー', 'takushii'],
  ])('acepta chōon: %s ← %s', (word, romaji) => {
    expect(typeWord(word, romaji)).toBe(true)
  })

  it.each([
    ['ほん', 'hon'],
    ['ほん', 'honn'],
    ['ぎんこう', 'ginkou'],
    ['ぎんこう', 'ginnkou'],
    ['びょういん', 'byouin'],
    ['でんわ', 'denwa'],
    ['パソコン', 'pasokon'],
    ['こうえん', 'kouen'],
    ['レストラン', 'resutoran'],
    ['インターネット', 'inta-netto'],
  ])('maneja ん: %s ← %s', (word, romaji) => {
    expect(typeWord(word, romaji)).toBe(true)
  })

  it.each([
    ['ねこ', 'meko'],
    ['みず', 'miza'],
  ])('rechaza entradas incorrectas: %s ← %s', (word, romaji) => {
    expect(typeWord(word, romaji)).toBe(false)
  })

  it('no consume la letra errónea (se puede corregir)', () => {
    const m = new Matcher('ねこ')
    expect(m.input('m')).toBe('error')
    expect(m.input('n')).toBe('progress')
    expect(m.input('e')).toBe('unit')
    expect(m.input('k')).toBe('progress')
    expect(m.input('o')).toBe('complete')
  })
})

describe('vocabulario', () => {
  it('todas las palabras se tokenizan con romaji en cada unidad', () => {
    for (const w of WORDS) {
      for (const u of tokenize(w.kana)) {
        expect(u.romaji.length, `${w.kana} — unidad ${u.text}`).toBeGreaterThan(0)
      }
    }
  })

  it('todas las palabras se pueden escribir con la primera grafía de cada unidad', () => {
    for (const w of WORDS) {
      const romaji = tokenize(w.kana).map((u) => u.romaji[0]).join('')
      expect(typeWord(w.kana, romaji), `${w.kana} ← ${romaji}`).toBe(true)
    }
  })
})
