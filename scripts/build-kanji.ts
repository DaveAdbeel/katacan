/**
 * Construye src/core/kanji/data.json: un diccionario compacto (lecturas
 * on/kun + significados en varios idiomas) con SOLO los kanji que
 * aparecen en el vocabulario de katacan (set básico + JLPT N5–N1),
 * a partir de KANJIDIC2 (vía jmdict-simplified, EDRDG + CC-BY-SA 4.0).
 *
 * Uso:
 *   node --experimental-strip-types scripts/build-kanji.ts <ruta-kanjidic2-all.json>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { WORDS } from '../src/core/words/data.ts'

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'] as const
const LANGS = ['en', 'es', 'fr', 'pt'] as const

interface KanjidicReading {
  type: string
  value: string
}
interface KanjidicMeaning {
  lang: string
  value: string
}
interface KanjidicGroup {
  readings: KanjidicReading[]
  meanings: KanjidicMeaning[]
}
interface KanjidicChar {
  literal: string
  misc: { grade: number | null; strokeCounts: number[]; frequency: number | null; jlptLevel: number | null }
  readingMeaning: { groups: KanjidicGroup[]; nanori: string[] } | null
}
interface KanjidicFile {
  characters: KanjidicChar[]
}

/** ¿Es este carácter un ideograma CJK (kanji)? */
function isKanjiChar(ch: string): boolean {
  const code = ch.codePointAt(0)!
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK unificado
    (code >= 0x3400 && code <= 0x4dbf) || // extensión A
    (code >= 0xf900 && code <= 0xfaff) // compatibilidad
  )
}

const srcPath = process.argv[2]
if (!srcPath) throw new Error('falta la ruta al JSON de kanjidic2-all')
const kanjidic: KanjidicFile = JSON.parse(readFileSync(srcPath, 'utf8'))
const byChar = new Map(kanjidic.characters.map((c) => [c.literal, c]))

// Recolecta todos los kanji usados en el vocabulario de la app
const used = new Set<string>()
function collectFrom(kanji: string | null) {
  if (!kanji) return
  for (const ch of kanji) if (isKanjiChar(ch)) used.add(ch)
}
for (const w of WORDS) collectFrom(w.kanji)
for (const level of LEVELS) {
  const entries: Array<{ j: string | null }> = JSON.parse(
    readFileSync(join(process.cwd(), `src/core/words/jlpt/${level}.json`), 'utf8'),
  )
  for (const e of entries) collectFrom(e.j)
}

const dict: Record<
  string,
  {
    on: string[]
    kun: string[]
    m: Partial<Record<(typeof LANGS)[number], string[]>>
    strokes: number | null
    grade: number | null
    jlpt: number | null
  }
> = {}

let missing = 0
for (const ch of used) {
  const c = byChar.get(ch)
  if (!c) {
    missing++
    continue
  }
  const on = new Set<string>()
  const kun = new Set<string>()
  const meanings: Partial<Record<(typeof LANGS)[number], string[]>> = {}
  for (const group of c.readingMeaning?.groups ?? []) {
    for (const r of group.readings) {
      if (r.type === 'ja_on') on.add(r.value)
      if (r.type === 'ja_kun') kun.add(r.value)
    }
    for (const lang of LANGS) {
      const values = group.meanings.filter((m) => m.lang === lang).map((m) => m.value)
      if (values.length) {
        meanings[lang] = [...(meanings[lang] ?? []), ...values].slice(0, 4)
      }
    }
  }
  dict[ch] = {
    on: [...on].slice(0, 6),
    kun: [...kun].slice(0, 6),
    m: meanings,
    strokes: c.misc.strokeCounts[0] ?? null,
    grade: c.misc.grade,
    jlpt: c.misc.jlptLevel,
  }
}

const outDir = join(process.cwd(), 'src/core/kanji')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'data.json'), JSON.stringify(dict))

console.log(`${used.size} kanji usados en el vocabulario, ${used.size - missing} encontrados en KANJIDIC2 (${missing} sin datos)`)
