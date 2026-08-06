import { useEffect, useState } from 'react'

/**
 * Estado persistido en localStorage. `merge` mezcla lo guardado con el
 * valor inicial para tolerar claves nuevas entre versiones.
 */
export function useLocalStorage<T extends object>(
  key: string,
  initial: () => T,
): [T, (patch: Partial<T> | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const base = initial()
    try {
      const raw = localStorage.getItem(key)
      if (raw) return { ...base, ...(JSON.parse(raw) as Partial<T>) }
    } catch {
      /* valor corrupto: usa el inicial */
    }
    return base
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  const update = (patch: Partial<T> | ((prev: T) => T)) => {
    setValue((prev) => (typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }))
  }

  return [value, update]
}
