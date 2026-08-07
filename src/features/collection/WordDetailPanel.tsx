import { useEffect, useMemo, useState } from 'react'
import { Link, type Location } from 'react-router'
import { loadKanjiDict, type KanjiInfo } from '../../core/kanji'
import { useSettings } from '../settings/SettingsContext'
import type { PoolWord } from '../practice/useWordPool'

interface Props {
  word: PoolWord
  /** Todas las palabras de la misma fuente que `word`, para las referencias cruzadas */
  pool: PoolWord[]
  onClose: () => void
  /** Ruta de fondo a preservar al navegar a una palabra relacionada */
  background: Partial<Location>
}

const KANJI_LANGS = ['en', 'es', 'fr', 'pt'] as const

function isKanjiChar(ch: string): boolean {
  const code = ch.codePointAt(0)!
  return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf)
}

/**
 * Panel con el detalle de una palabra ya dominada: significado, kanji,
 * sus lecturas y significados, y otras palabras del pool actual que
 * comparten alguno de esos kanji.
 */
export function WordDetailPanel({ word, pool, onClose, background }: Props) {
  const { settings, t } = useSettings()
  const [kanjiDict, setKanjiDict] = useState<Record<string, KanjiInfo> | null>(null)

  useEffect(() => {
    let cancelled = false
    loadKanjiDict().then((d) => {
      if (!cancelled) setKanjiDict(d)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const kanjiChars = word.kanji ? [...new Set([...word.kanji].filter(isKanjiChar))] : []

  const relatedByKanji = useMemo(() => {
    const map = new Map<string, PoolWord[]>()
    for (const ch of kanjiChars) {
      const matches = pool.filter(
        (w) => w.id !== word.id && w.kanji?.includes(ch),
      )
      if (matches.length) map.set(ch, matches.slice(0, 6))
    }
    return map
  }, [pool, word.id, word.kanji])

  const meaning = word.meanings[settings.lang] ?? word.meanings.en
  const lang = KANJI_LANGS.includes(settings.lang as (typeof KANJI_LANGS)[number])
    ? (settings.lang as (typeof KANJI_LANGS)[number])
    : 'en'

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-[35rem] overflow-y-auto rounded-2xl border border-line bg-raised p-[1.875rem] shadow-[0_0_40px_-8px_var(--accent)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-jp text-[2.35rem] text-(--accent)">{word.kana}</div>
            {word.kanji && <div className="mt-1 font-jp text-[1.4rem] text-dim">{word.kanji}</div>}
            <div className="mt-2 text-[1.1rem] text-dim">{meaning}</div>
          </div>
          <button
            type="button"
            aria-label="close"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-lg text-dim transition-colors hover:bg-hover hover:text-ink"
          >
            ✕
          </button>
        </div>

        {kanjiChars.length > 0 && (
          <div className="mt-[1.875rem] space-y-5">
            <h3 className="text-[0.85rem] font-medium uppercase tracking-[0.2em] text-faint">
              {t.kanjiLabel}
            </h3>
            <p className="-mt-3 text-[0.9rem] leading-snug text-faint">{t.kanjiNotationHint}</p>
            {kanjiChars.map((ch) => {
              const info = kanjiDict?.[ch]
              const meanings = info?.m[lang] ?? info?.m.en ?? []
              return (
                <div key={ch} className="rounded-lg border border-line p-4">
                  <div className="flex items-baseline gap-4">
                    <span className="font-jp text-[1.875rem] text-ink">{ch}</span>
                    <span className="text-[1.1rem] text-dim">{meanings.join(', ')}</span>
                  </div>
                  {info && (info.on.length > 0 || info.kun.length > 0) && (
                    <div className="mt-4 space-y-3">
                      {info.on.length > 0 && (
                        <div>
                          <div className="text-[0.85rem] text-faint">
                            {t.onyomiLabel}{' '}
                            <span className="text-faint/70">· {t.onyomiHint}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {info.on.map((r) => (
                              <span
                                key={r}
                                className="rounded-md border border-line px-2 py-1 font-jp text-[1rem] text-dim"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {info.kun.length > 0 && (
                        <div>
                          <div className="text-[0.85rem] text-faint">
                            {t.kunyomiLabel}{' '}
                            <span className="text-faint/70">· {t.kunyomiHint}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {info.kun.map((r) => (
                              <span
                                key={r}
                                className="rounded-md border border-line px-2 py-1 font-jp text-[1rem] text-dim"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {relatedByKanji.has(ch) && (
                    <div className="mt-4 border-t border-line pt-3">
                      <div className="mb-2 text-[0.85rem] uppercase tracking-[0.15em] text-faint">
                        {t.usedInLabel}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {relatedByKanji.get(ch)!.map((w) => (
                          <Link
                            key={w.id}
                            to={`/word/${encodeURIComponent(w.id)}`}
                            state={{ backgroundLocation: background }}
                            onClick={(e) => e.stopPropagation()}
                            className="cursor-pointer rounded-full border border-line px-3 py-1.5 font-jp text-[1rem] text-dim transition-colors hover:border-(--accent) hover:text-(--accent)"
                            title={w.meanings[settings.lang] ?? w.meanings.en}
                          >
                            {w.kanji ?? w.kana}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
