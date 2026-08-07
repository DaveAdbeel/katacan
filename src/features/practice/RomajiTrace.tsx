import { useSettings } from '../settings/SettingsContext'

interface Props {
  /** Todo el romaji tecleado para la palabra, tal cual (incluye errores) */
  typed: string
  /** Cuántos caracteres al final de `typed` corresponden a la cola en curso */
  bufferLength: number
  bufferValid: boolean
  awaitingNext: boolean
}

/**
 * Romaji tecleado por el usuario, acumulado durante toda la palabra.
 * No se borra hasta que empieza la siguiente palabra (o con backspace).
 * La parte que ya no encaja con ninguna grafía se resalta en rojo, sin
 * dejar de mostrarse: el objetivo es que se note el error, no ocultarlo.
 */
export function RomajiTrace({ typed, bufferLength, bufferValid, awaitingNext }: Props) {
  const { settings, t } = useSettings()
  const settled = bufferLength > 0 ? typed.slice(0, typed.length - bufferLength) : typed
  const buffer = bufferLength > 0 ? typed.slice(typed.length - bufferLength) : ''

  return (
    <div className="flex min-h-[2.6em] flex-col items-center gap-1">
      {settings.showRomajiTrace && (
        <div
          data-testid="romaji-trace"
          className="min-h-[1.3em] text-[0.9rem] tracking-[0.15em] text-dim"
        >
          <span>{settled}</span>
          <span className={bufferValid ? '' : 'text-danger'}>{buffer}</span>
        </div>
      )}
      <div className="min-h-[1.3em] text-[0.75rem] tracking-[0.1em] text-faint">
        {awaitingNext ? t.pressAnyKey : ''}
      </div>
    </div>
  )
}
