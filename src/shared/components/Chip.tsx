interface Props {
  active: boolean
  onClick: () => void
  children: string
}

/** Chip seleccionable (categorías). */
export function Chip({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-3 py-1 text-[0.75rem] transition-colors ${
        active ? 'border-(--accent) text-(--accent)' : 'border-line text-dim hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
