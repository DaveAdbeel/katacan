import type { PoolWord } from '../practice/useWordPool'

interface Props {
  word: PoolWord
  mastered: boolean
  onClick: () => void
}

/**
 * Ficha de una palabra en la colección: brilla con el color de acento
 * si ya se escribió bien alguna vez, o queda apagada/sin contraste si
 * todavía no.
 */
export function WordCard({ word, mastered, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={mastered ? onClick : undefined}
      aria-disabled={!mastered}
      className={
        'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition-transform ' +
        (mastered
          ? 'cursor-pointer border-(--accent)/50 bg-raised shadow-[0_0_16px_-3px_var(--accent)] hover:scale-105 hover:shadow-[0_0_22px_-2px_var(--accent)]'
          : 'cursor-default border-line bg-bg')
      }
    >
      <span
        className={
          'font-jp text-base leading-tight sm:text-lg ' + (mastered ? 'text-ink' : 'text-faint')
        }
      >
        {word.kana}
      </span>
      {word.kanji && (
        <span
          className={'font-jp text-[0.7rem] leading-tight sm:text-xs ' + (mastered ? 'text-dim' : 'text-faint/60')}
        >
          {word.kanji}
        </span>
      )}
    </button>
  )
}
