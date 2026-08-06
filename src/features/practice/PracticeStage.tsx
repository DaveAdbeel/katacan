import { useEffect, useRef } from 'react'
import { useSettings } from '../settings/SettingsContext'
import type { FontScale } from '../settings/types'
import { RomajiTrace } from './RomajiTrace'
import { WordDisplay } from './WordDisplay'
import type { TypingGame } from './useTypingGame'

const MEANING_SIZE: Record<FontScale, string> = {
  s: 'text-[1rem] sm:text-[1.1rem]',
  m: 'text-[1.15rem] sm:text-[1.35rem]',
  l: 'text-[1.3rem] sm:text-[1.6rem]',
}

const KANJI_SIZE: Record<FontScale, string> = {
  s: 'text-[1.15rem] sm:text-[1.3rem]',
  m: 'text-[1.35rem] sm:text-[1.6rem]',
  l: 'text-[1.6rem] sm:text-[2rem]',
}

interface Props {
  game: TypingGame
  /** Con el panel de ajustes abierto se ignora el teclado de juego */
  settingsOpen: boolean
  onToggleSettings: () => void
}

/** Escena central: categoría/nivel, significado, kana, kanji y romaji tecleado. */
export function PracticeStage({ game, settingsOpen, onToggleSettings }: Props) {
  const { settings, t } = useSettings()
  const { view, handleChar, skip, reveal, continueNext } = game
  const inputRef = useRef<HTMLInputElement>(null)

  /** Punto único de entrada de letras (teclado físico y virtual). */
  const routeChar = (ch: string) => {
    if (view.awaitingNext) {
      continueNext()
      return
    }
    handleChar(ch)
  }

  // Listener global para teclado físico; el handler vive en un ref para
  // registrarlo una sola vez
  const handlerRef = useRef<(e: KeyboardEvent) => void>(() => {})
  handlerRef.current = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onToggleSettings()
      return
    }
    if (settingsOpen || e.metaKey || e.ctrlKey || e.altKey) return

    if (view.awaitingNext) {
      e.preventDefault()
      continueNext()
      return
    }
    if (view.completed || !view.word) return

    if (e.key === ' ') {
      e.preventDefault()
      skip()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      if (settings.recallMode) reveal()
      return
    }
    // Las letras que llegan al input oculto se procesan en su onInput
    // (así el teclado virtual y el físico no se duplican)
    if (e.target === inputRef.current) return
    const ch = e.key.toLowerCase()
    if (/^[a-z-]$/.test(ch)) {
      e.preventDefault()
      routeChar(ch)
    }
  }

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handlerRef.current(e)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])

  const label = view.word
    ? view.word.category
      ? t[`categories_${view.word.category}`]
      : view.word.level?.toUpperCase()
    : ''

  const meaning = view.word
    ? (view.word.meanings[settings.lang] ?? view.word.meanings.en)
    : ''

  return (
    <main
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 text-center sm:gap-4 sm:px-6"
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      {/* Input oculto: invoca el teclado virtual en móvil */}
      <input
        ref={inputRef}
        type="text"
        aria-hidden="true"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        className="pointer-events-none absolute size-px opacity-0"
        onInput={(e) => {
          const value = e.currentTarget.value
          e.currentTarget.value = ''
          for (const ch of value.toLowerCase()) {
            if (/^[a-z-]$/.test(ch)) routeChar(ch)
          }
        }}
      />

      {view.loading || !view.word ? (
        <p className={`${MEANING_SIZE[settings.fontScale]} text-dim`}>
          {view.loading ? '…' : t.emptyPool}
        </p>
      ) : (
        <>
          <div className="text-[0.7rem] uppercase tracking-[0.25em] text-faint">{label}</div>
          <div className={`${MEANING_SIZE[settings.fontScale]} max-w-xl text-dim`}>{meaning}</div>
          <WordDisplay
            units={view.units}
            unitIndex={view.unitIndex}
            completed={view.completed}
            revealed={view.revealed}
            errorPulse={view.errorPulse}
          />
          <div
            className={`${KANJI_SIZE[settings.fontScale]} min-h-[1.4em] max-w-full font-jp ${
              view.completed ? 'text-dim' : 'text-faint'
            } ${settings.showKanji && view.word.kanji ? '' : 'invisible'}`}
          >
            {view.word.kanji ?? ''}
          </div>
          <RomajiTrace trace={view.romajiTrace} awaitingNext={view.awaitingNext} />

          {/* Acciones táctiles (solo pantallas pequeñas) */}
          <div className="flex gap-3 sm:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                skip()
              }}
              className="rounded-full border border-line px-4 py-1.5 text-[0.78rem] text-dim active:border-(--accent) active:text-(--accent)"
            >
              {t.skip}
            </button>
            {settings.recallMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  reveal()
                }}
                className="rounded-full border border-line px-4 py-1.5 text-[0.78rem] text-dim active:border-(--accent) active:text-(--accent)"
              >
                {t.reveal}
              </button>
            )}
          </div>
        </>
      )}
    </main>
  )
}
