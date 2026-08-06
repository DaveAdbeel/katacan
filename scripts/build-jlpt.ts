/**
 * Convierte los CSV de open-anki-jlpt-decks (MIT, basados en las listas
 * de Jonathan Waller) a los JSON tipados de src/core/words/jlpt/.
 *
 * Uso:
 *   node --experimental-strip-types scripts/build-jlpt.ts <dir-con-csvs>
 *
 * Cada entrada se valida contra el motor de kana: si la lectura contiene
 * algo que no se puede teclear (latín, kanji, símbolos), se descarta y
 * se reporta.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tokenize } from '../src/core/kana/tokenizer.ts'

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'] as const

/** Parser CSV mínimo con soporte de comillas (formato del dataset). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((f) => f !== '')) rows.push(row)
  }
  return rows
}

function isTypeable(kana: string): boolean {
  try {
    const units = tokenize(kana)
    return units.length > 0 && units.every((u) => u.romaji.length > 0)
  } catch {
    return false
  }
}

/**
 * Normaliza expresión/lectura del dataset: quita anotaciones entre
 * paréntesis, marcas de sufijo/prefijo (～) y se queda con la primera
 * de las lecturas alternativas ("いい; よい" → "いい").
 */
function clean(raw: string): string {
  return raw
    .replace(/[(（][^)）]*[)）]/g, '')
    .split(/[;；・]/)[0]
    .replace(/[～〜]/g, '')
    .trim()
}

const srcDir = process.argv[2]
if (!srcDir) throw new Error('falta el directorio con los CSV')
const outDir = join(process.cwd(), 'src/core/words/jlpt')
mkdirSync(outDir, { recursive: true })

for (const level of LEVELS) {
  const rows = parseCsv(readFileSync(join(srcDir, `${level}.csv`), 'utf8'))
  const [header, ...data] = rows
  const col = (name: string) => header.indexOf(name)
  const iExpr = col('expression')
  const iRead = col('reading')
  const iMean = col('meaning')

  const seen = new Set<string>()
  const dropped: string[] = []
  const entries: Array<{ k: string; j: string | null; m: string }> = []

  for (const r of data) {
    const expression = clean(r[iExpr] ?? '')
    const reading = clean(r[iRead] ?? '').normalize('NFC') || expression
    const meaning = r[iMean]?.trim() ?? ''
    if (!reading || !meaning) continue
    if (!isTypeable(reading)) {
      dropped.push(`${expression} (${reading})`)
      continue
    }
    const key = `${reading}|${meaning}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({
      k: reading,
      j: expression && expression !== reading ? expression : null,
      m: meaning,
    })
  }

  writeFileSync(join(outDir, `${level}.json`), JSON.stringify(entries))
  console.log(
    `${level}: ${entries.length} palabras (${dropped.length} descartadas${
      dropped.length ? ': ' + dropped.slice(0, 8).join(', ') + (dropped.length > 8 ? '…' : '') : ''
    })`,
  )
}
