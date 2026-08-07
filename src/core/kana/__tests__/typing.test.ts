import { describe, expect, it } from 'vitest'
import { evaluateTyping, tokenize } from '..'
import { WORDS } from '../../words'

/** Simula teclear romaji letra a letra, sin bloquear nunca la entrada. */
function type(word: string, romaji: string) {
  const units = tokenize(word)
  let typed = ''
  let last = evaluateTyping(units, typed)
  for (const ch of romaji) {
    typed += ch
    last = evaluateTyping(units, typed)
  }
  return { typed, ...last }
}

function backspace(units: ReturnType<typeof tokenize>, typed: string) {
  const newTyped = typed.slice(0, -1)
  return { typed: newTyped, ...evaluateTyping(units, newTyped) }
}

describe('evaluateTyping — grafías correctas', () => {
  it.each([
    ['ねこ', 'neko'],
    ['みず', 'mizu'],
    ['し', 'shi'],
    ['し', 'si'],
    ['つき', 'tsuki'],
    ['つき', 'tuki'],
    ['ふゆ', 'fuyu'],
    ['ふゆ', 'huyu'],
    ['きょう', 'kyou'],
    ['でんしゃ', 'densha'],
    ['でんしゃ', 'densya'],
    ['チョコレート', 'chokore-to'],
    ['チョコレート', 'chokoreeto'],
    ['がっこう', 'gakkou'],
    ['ベッド', 'beddo'],
    ['サッカー', 'sakka-'],
    ['コーヒー', 'ko-hi-'],
    ['コーヒー', 'koohii'],
    ['ほん', 'hon'],
    ['ほん', 'honn'],
    ['ぎんこう', 'ginkou'],
    ['ぎんこう', 'ginnkou'],
    ['びょういん', 'byouin'],
    ['パソコン', 'pasokon'],
  ])('%s ← %s se completa sin errores', (word, romaji) => {
    const r = type(word, romaji)
    expect(r.done).toBe(true)
    expect(r.valid).toBe(true)
  })
})

describe('evaluateTyping — nunca rechaza, siempre corregible', () => {
  it('una tecla equivocada no bloquea: se marca inválida pero se puede seguir escribiendo', () => {
    const units = tokenize('ねこ') // "neko"
    let typed = 'm' // debería ser "n"
    let state = evaluateTyping(units, typed)
    expect(state.valid).toBe(false)
    expect(state.buffer).toBe('m')
    expect(state.unitIndex).toBe(0)

    // Sigue aceptando más teclas aunque ya esté mal
    typed += 'x'
    state = evaluateTyping(units, typed)
    expect(state.valid).toBe(false)
    expect(state.buffer).toBe('mx')
  })

  it('cualquier secuencia de letras al azar se acepta sin lanzar error', () => {
    const units = tokenize('こんにちは')
    expect(() => evaluateTyping(units, 'qwzxjklpv')).not.toThrow()
    const state = evaluateTyping(units, 'qwzxjklpv')
    expect(state.valid).toBe(false)
    expect(state.done).toBe(false)
  })

  it('borrar (backspace) permite corregir un error y completar la palabra', () => {
    const units = tokenize('ねこ') // "neko"
    let typed = 'nx' // "n" bien, "x" mal en vez de "e"
    let state = evaluateTyping(units, typed)
    expect(state.valid).toBe(false)

    // Backspace: borra la "x"
    ;({ typed } = backspace(units, typed))
    state = evaluateTyping(units, typed)
    expect(state.valid).toBe(true)
    expect(state.buffer).toBe('n')

    // Termina de escribir correctamente
    typed += 'eko'
    state = evaluateTyping(units, typed)
    expect(state.done).toBe(true)
  })

  it('backspace puede deshacer una unidad ya completada y volver a ella', () => {
    const units = tokenize('ねこ')
    let typed = 'ne' // ね completa
    let state = evaluateTyping(units, typed)
    expect(state.unitIndex).toBe(1)

    // Borra la "e": vuelve a estar a mitad de la primera unidad
    typed = typed.slice(0, -1)
    state = evaluateTyping(units, typed)
    expect(state.unitIndex).toBe(0)
    expect(state.buffer).toBe('n')
    expect(state.valid).toBe(true)
  })

  it('backspace hasta vaciar el buffer dobla dentro de la primera unidad sin error', () => {
    const units = tokenize('ねこ')
    const state = evaluateTyping(units, '')
    expect(state.unitIndex).toBe(0)
    expect(state.buffer).toBe('')
    expect(state.valid).toBe(true)
    expect(state.done).toBe(false)
  })
})

describe('evaluateTyping — vocabulario completo', () => {
  it('todas las palabras se pueden escribir con la primera grafía de cada unidad', () => {
    for (const w of WORDS) {
      const units = tokenize(w.kana)
      const romaji = units.map((u) => u.romaji[0]).join('')
      const r = type(w.kana, romaji)
      expect(r.done, `${w.kana} ← ${romaji}`).toBe(true)
    }
  })
})
