import { useEffect, useRef } from 'react'
import { useSettings } from '../settings/SettingsContext'
import type { FontScale } from '../settings/types'
import { RomajiTrace } from './RomajiTrace'
import { WordDisplay } from './WordDisplay'
import type { TypingGame } from './useTypingGame'

const MEANING_SIZE: Record<FontScale, string> = {
  s: 'text-[1.1rem]',
  m: 'text-[1.35rem]',
  l: 'text-[1.6rem]',
}

const KANJI_SIZE: Record<FontScale, string> = {
  s: 'text-[1.3rem]',
  m: 'text-[1.6rem]',
  l: 'text-[2rem]',
}

interface Props {
  game: TypingGame
  /** Con el panel de ajustes abierto se ignora el teclado de juego */
  settingsOpen: boolean
  onToggleSettings: () => void
}

/** Escena central: categoría, significado, kana, kanji y romaji tecleado. */
export function PracticeStage({ game, settingsOpen, onToggleSettings }: Props) {
  const { settings, t } = useSettings()
  const { view, handleChar, skip, reveal, continueNext } = game

  // Listener global de teclado; el handler vive en un ref para
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
    const ch = e.key.toLowerCase()
    if (/^[a-z-]$/.test(ch)) {
      e.preventDefault()
      handleChar(ch)
    }
  }

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handlerRef.current(e)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])

  if (!view.word) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className={`${MEANING_SIZE[settings.fontScale]} text-dim`}>{t.emptyPool}</p>
      </main>
    )
  }

  const word = view.word
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-[0.7rem] uppercase tracking-[0.25em] text-faint">
        {t[`categories_${word.category}`]}
      </div>
      <div className={`${MEANING_SIZE[settings.fontScale]} max-w-xl text-dim`}>
        {word.translations[settings.lang]}
      </div>
      <WordDisplay
        units={view.units}
        unitIndex={view.unitIndex}
        completed={view.completed}
        revealed={view.revealed}
        errorPulse={view.errorPulse}
      />
      <div
        className={`${KANJI_SIZE[settings.fontScale]} min-h-[1.4em] font-jp ${
          view.completed ? 'text-dim' : 'text-faint'
        } ${settings.showKanji && word.kanji ? '' : 'invisible'}`}
      >
        {word.kanji ?? ''}
      </div>
      <RomajiTrace trace={view.romajiTrace} awaitingNext={view.awaitingNext} />
    </main>
  )
}
