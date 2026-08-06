import { useSettings } from '../settings/SettingsContext'

interface Props {
  trace: string
  awaitingNext: boolean
}

/**
 * Romaji tecleado por el usuario, acumulado durante toda la palabra.
 * No se borra hasta que empieza la siguiente palabra.
 */
export function RomajiTrace({ trace, awaitingNext }: Props) {
  const { settings, t } = useSettings()

  return (
    <div className="flex min-h-[2.6em] flex-col items-center gap-1">
      {settings.showRomajiTrace && (
        <div data-testid="romaji-trace" className="min-h-[1.3em] text-[0.9rem] tracking-[0.15em] text-dim">
          {trace}
        </div>
      )}
      <div className="min-h-[1.3em] text-[0.75rem] tracking-[0.1em] text-faint">
        {awaitingNext ? t.pressAnyKey : ''}
      </div>
    </div>
  )
}
