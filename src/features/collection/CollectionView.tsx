import { useLocation, useNavigate } from 'react-router'
import { useMastery } from '../mastery/MasteryContext'
import { useWordPool } from '../practice/useWordPool'
import { useSettings } from '../settings/SettingsContext'
import { WordCard } from './WordCard'

/**
 * Vista de colección: una ficha por palabra del pool actual (nivel +
 * categorías + silabario activos), brillando en cuanto se escribió
 * bien alguna vez. Tocar una ficha ya dominada abre su propia página
 * de detalle (/word/:id), superpuesta sobre esta vista.
 */
export function CollectionView() {
  const { t } = useSettings()
  const { words, loading } = useWordPool()
  const { isMastered } = useMastery()
  const navigate = useNavigate()
  const location = useLocation()

  const masteredInPool = words.filter((w) => isMastered(w.id)).length

  const openWord = (id: string) =>
    navigate(`/word/${encodeURIComponent(id)}`, { state: { backgroundLocation: location } })

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-baseline justify-between px-5 pt-5 pb-2.5 sm:px-7">
        <span className="text-[0.875rem] uppercase tracking-[0.2em] text-faint">
          {t.tabCollection}
        </span>
        <span className="text-[0.98rem] tabular-nums text-dim">
          {masteredInPool} / {words.length} <em className="not-italic text-faint">{t.masteredLabel}</em>
        </span>
      </div>

      {loading ? (
        <p className="flex flex-1 items-center justify-center text-dim">…</p>
      ) : words.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-dim">{t.emptyPool}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] gap-2.5 overflow-y-auto px-5 pb-7 sm:grid-cols-[repeat(auto-fill,minmax(112px,1fr))] sm:gap-4 sm:px-7">
          {words.map((w) => (
            <WordCard
              key={w.id}
              word={w}
              mastered={isMastered(w.id)}
              onClick={() => openWord(w.id)}
            />
          ))}
        </div>
      )}
    </main>
  )
}
