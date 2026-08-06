import { useSettings } from '../settings/SettingsContext'
import { useStats } from './StatsContext'

/** Resumen compacto de estadísticas para la cabecera. */
export function StatsBar() {
  const { t } = useSettings()
  const { stats, accuracy } = useStats()

  const items: Array<[string | number, string]> = [
    [stats.words, t.statsWords],
    [`${accuracy}%`, t.statsAccuracy],
    [stats.streak, t.statsStreak],
  ]

  return (
    <div className="flex gap-4 text-[0.8rem] tabular-nums text-dim max-sm:gap-3 max-sm:text-[0.72rem]">
      {items.map(([value, label]) => (
        <span key={label}>
          {value} <em className="text-[0.7rem] not-italic text-faint">{label}</em>
        </span>
      ))}
    </div>
  )
}
