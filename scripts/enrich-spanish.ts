/**
 * Enriquece src/core/words/jlpt/*.json con traducciones al español,
 * tomadas de la variante en español de jmdict-simplified (scriptin/jmdict-simplified,
 * derivado de JMdict/EDRDG, licencia EDRDG + CC-BY-SA 4.0).
 *
 * Uso:
 *   node --experimental-strip-types scripts/enrich-spanish.ts <ruta-jmdict-spa.json>
 *
 * Empareja cada entrada JLPT (lectura kana + kanji opcional) contra el
 * diccionario por (kanji, kana) y, si no hay kanji, por kana solo. Si no
 * se encuentra una traducción en español, la entrada se deja sin el
 * campo "s" y la app recae en el significado en inglés.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'] as const

interface JMKanji {
  common: boolean
  text: string
}
interface JMKana {
  common: boolean
  text: string
}
interface JMGloss {
  lang: string
  text: string
}
interface JMSense {
  gloss: JMGloss[]
}
interface JMWord {
  id: string
  kanji: JMKanji[]
  kana: JMKana[]
  sense: JMSense[]
}
interface JMFile {
  words: JMWord[]
}

interface JlptEntry {
  k: string
  j: string | null
  m: string
  s?: string
}

const srcPath = process.argv[2]
if (!srcPath) throw new Error('falta la ruta al JSON de jmdict-spa')
const jmdict: JMFile = JSON.parse(readFileSync(srcPath, 'utf8'))

const kanjiIndex = new Map<string, JMWord[]>()
const kanaIndex = new Map<string, JMWord[]>()
for (const w of jmdict.words) {
  for (const k of w.kanji) {
    if (!kanjiIndex.has(k.text)) kanjiIndex.set(k.text, [])
    kanjiIndex.get(k.text)!.push(w)
  }
  for (const k of w.kana) {
    if (!kanaIndex.has(k.text)) kanaIndex.set(k.text, [])
    kanaIndex.get(k.text)!.push(w)
  }
}

function isCommon(w: JMWord): boolean {
  return w.kanji.some((k) => k.common) || w.kana.some((k) => k.common)
}

/** Glosas en español de una entrada, una por sentido, sin duplicados. */
function spanishGloss(w: JMWord): string | null {
  const parts: string[] = []
  for (const sense of w.sense) {
    const g = sense.gloss.find((g) => g.lang === 'spa')
    if (g && !parts.includes(g.text)) parts.push(g.text)
    if (parts.length >= 3) break // suficiente para el significado, evita frases kilométricas
  }
  return parts.length ? parts.join('; ') : null
}

function findMatch(kana: string, kanji: string | null): JMWord | null {
  let candidates: JMWord[] = []
  if (kanji) {
    candidates = kanjiIndex.get(kanji) ?? []
    if (candidates.length > 1) {
      const withReading = candidates.filter((w) => w.kana.some((k) => k.text === kana))
      if (withReading.length) candidates = withReading
    }
  }
  if (candidates.length === 0) {
    candidates = kanaIndex.get(kana) ?? []
  }
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]
  return candidates.find(isCommon) ?? candidates[0]
}

/**
 * Verbos "sustantivo + する" (p. ej. コピーする) suelen no tener entrada
 * propia en JMdict: se busca el sustantivo base y se deriva el sentido
 * verbal a partir de su traducción.
 */
function suruFallback(kana: string, kanji: string | null): string | null {
  if (!kana.endsWith('する') || kana.length <= 2) return null
  const baseKana = kana.slice(0, -2)
  const baseKanji = kanji?.endsWith('する') ? kanji.slice(0, -2) : null
  const word = findMatch(baseKana, baseKanji)
  const gloss = word ? spanishGloss(word) : null
  return gloss ? `hacer ${gloss}` : null
}

let totalMatched = 0
let totalEntries = 0

for (const level of LEVELS) {
  const path = join(process.cwd(), `src/core/words/jlpt/${level}.json`)
  const entries: JlptEntry[] = JSON.parse(readFileSync(path, 'utf8'))

  let matched = 0
  for (const e of entries) {
    const word = findMatch(e.k, e.j)
    const gloss = (word ? spanishGloss(word) : null) ?? suruFallback(e.k, e.j)
    if (gloss) {
      e.s = gloss
      matched++
    } else {
      delete e.s
    }
  }

  writeFileSync(path, JSON.stringify(entries))
  totalMatched += matched
  totalEntries += entries.length
  console.log(`${level}: ${matched}/${entries.length} con español (${Math.round((matched / entries.length) * 100)}%)`)
}

console.log(`Total: ${totalMatched}/${totalEntries} (${Math.round((totalMatched / totalEntries) * 100)}%)`)
