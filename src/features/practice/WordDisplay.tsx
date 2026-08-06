import type { KanaUnit } from '../../core/kana'
import { useSettings } from '../settings/SettingsContext'
import type { FontScale } from '../settings/types'

const WORD_SIZE: Record<FontScale, string> = {
  s: 'text-[2.6rem]',
  m: 'text-[3.4rem]',
  l: 'text-[4.4rem]',
}

interface Props {
  units: KanaUnit[]
  unitIndex: number
  completed: boolean
  revealed: boolean
  errorPulse: number
}

/** Palabra kana con progreso coloreado; en modo memoria se enmascara. */
export function WordDisplay({ units, unitIndex, completed, revealed, errorPulse }: Props) {
  const { settings } = useSettings()
  const hidden = settings.recallMode && !revealed && !completed

  return (
    <div
      key={errorPulse > 0 ? errorPulse : undefined}
      data-testid="word"
      className={`${WORD_SIZE[settings.fontScale]} min-h-[1.25em] font-jp leading-[1.25] tracking-[0.06em] ${errorPulse > 0 ? 'animate-shake' : ''}`}
    >
      {units.map((u, i) => {
        const isDone = i < unitIndex || completed
        const isCurrent = i === unitIndex && !completed
        const masked = hidden && !isDone

        let color = 'text-faint'
        if (isDone) color = 'text-(--accent)'
        else if (revealed) color = 'text-dim'
        else if (isCurrent) color = masked ? 'text-dim' : 'text-ink'

        return (
          <span key={i} className={`${color} transition-colors duration-100`}>
            {masked ? '・' : u.text}
          </span>
        )
      })}
    </div>
  )
}
