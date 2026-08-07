import { useState } from 'react'
import { CollectionView } from './features/collection/CollectionView'
import { PracticeStage } from './features/practice/PracticeStage'
import { useTypingGame } from './features/practice/useTypingGame'
import { SettingsPanel } from './features/settings/SettingsPanel'
import { useSettings } from './features/settings/SettingsContext'
import { StatsBar } from './features/stats/StatsBar'

type View = 'practice' | 'collection'

function GearIcon() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg
      width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg
      width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export default function App() {
  const { settings, t } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [view, setView] = useState<View>('practice')
  const game = useTypingGame()

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-6 py-4 max-sm:px-4 max-sm:py-3">
        <div className="flex shrink-0 items-baseline gap-2.5 max-sm:gap-1.5">
          <span className="whitespace-nowrap font-jp text-[1.05rem] font-normal text-(--accent) max-sm:text-[0.95rem]">カタカン</span>
          <span className="text-[0.95rem] tracking-[0.12em] max-sm:hidden">katacan</span>
          <span className="text-[0.75rem] tracking-[0.05em] text-faint max-sm:hidden">
            {t.tagline}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          {view === 'practice' && <StatsBar />}
          <div className="flex items-center gap-1 rounded-lg border border-line p-0.5">
            <button
              type="button"
              aria-label={t.tabPractice}
              aria-pressed={view === 'practice'}
              onClick={() => setView('practice')}
              className={`flex cursor-pointer items-center rounded-md p-1.5 transition-colors ${
                view === 'practice' ? 'bg-hover text-(--accent)' : 'text-dim hover:text-ink'
              }`}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              aria-label={t.tabCollection}
              aria-pressed={view === 'collection'}
              onClick={() => setView('collection')}
              className={`flex cursor-pointer items-center rounded-md p-1.5 transition-colors ${
                view === 'collection' ? 'bg-hover text-(--accent)' : 'text-dim hover:text-ink'
              }`}
            >
              <GridIcon />
            </button>
          </div>
          <button
            type="button"
            aria-label={t.settings}
            onClick={() => setSettingsOpen(true)}
            className="flex cursor-pointer items-center rounded-lg p-1.5 text-dim transition-colors hover:bg-hover hover:text-ink"
          >
            <GearIcon />
          </button>
        </div>
      </header>

      {view === 'practice' ? (
        <PracticeStage
          game={game}
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen((v) => !v)}
        />
      ) : (
        <CollectionView />
      )}

      {view === 'practice' && (
        <footer className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 text-[0.72rem] tracking-[0.04em] text-faint max-sm:hidden">
          <span className="max-sm:hidden">{t.hint}</span>
          <span className="flex gap-5">
            <span>{t.keySkip}</span>
            {settings.recallMode && <span>{t.keyReveal}</span>}
            <span>{t.keySettings}</span>
          </span>
        </footer>
      )}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
