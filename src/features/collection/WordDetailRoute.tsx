import { useEffect, useState } from 'react'
import { useNavigate, useParams, type Location } from 'react-router'
import { findWordById, loadPoolForSource, wordSource, type PoolWord } from '../../core/words'
import { WordDetailPanel } from './WordDetailPanel'

interface Props {
  /** Ruta que debe quedar de fondo (a la que se vuelve al cerrar) */
  background: Partial<Location>
}

/**
 * Ruta /word/:id — resuelve la palabra por su id (sin depender de los
 * ajustes activos) y su propia fuente completa (set básico o el nivel
 * JLPT al que pertenece) para las referencias cruzadas, y muestra el
 * panel de detalle. Se usa como superposición sobre la ruta de fondo
 * (ver App.tsx), así que "cerrar" vuelve a esa ruta de fondo.
 */
export function WordDetailRoute({ background }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [word, setWord] = useState<PoolWord | null | undefined>(undefined)
  const [pool, setPool] = useState<PoolWord[]>([])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const decoded = decodeURIComponent(id)
    setWord(undefined)
    setPool([])

    findWordById(decoded).then((w) => {
      if (cancelled) return
      setWord(w)
      if (w) loadPoolForSource(wordSource(w)).then((words) => !cancelled && setPool(words))
    })

    return () => {
      cancelled = true
    }
  }, [id])

  const close = () => navigate(background.pathname ?? '/')

  if (!word) return null
  return <WordDetailPanel word={word} pool={pool} onClose={close} background={background} />
}
