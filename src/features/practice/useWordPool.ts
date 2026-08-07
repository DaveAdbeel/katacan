import { useEffect, useState } from 'react'
import { isKatakanaChar } from '../../core/kana'
import {
  WORDS,
  loadPoolForSource,
  toPoolWordFromBasic,
  type PoolWord,
  type Script,
} from '../../core/words'
import { useSettings } from '../settings/SettingsContext'

export type { PoolWord } from '../../core/words'

function kanaScript(kana: string): Script {
  return isKatakanaChar([...kana][0]) ? 'katakana' : 'hiragana'
}

/**
 * Lista de palabras que corresponde a los filtros activos (nivel,
 * categorías, silabario). La usan tanto la práctica de escritura como
 * la vista de colección, para que compartan exactamente el mismo pool.
 */
export function useWordPool(): { words: PoolWord[]; loading: boolean } {
  const { settings } = useSettings()
  const { script, categories, level } = settings
  const [state, setState] = useState<{ words: PoolWord[]; loading: boolean }>({
    words: [],
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    setState({ words: [], loading: true })

    const finish = (words: PoolWord[]) => {
      if (cancelled) return
      setState({
        words: words.filter((w) => script === 'both' || kanaScript(w.kana) === script),
        loading: false,
      })
    }

    if (level === 'basic') {
      finish(WORDS.filter((w) => categories.includes(w.category)).map(toPoolWordFromBasic))
    } else {
      loadPoolForSource(level).then(finish)
    }

    return () => {
      cancelled = true
    }
  }, [script, categories, level])

  return state
}
