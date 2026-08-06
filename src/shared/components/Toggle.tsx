interface Props {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}

/** Interruptor accesible con el estilo de la app. */
export function Toggle({ checked, onChange, label }: Props) {
  return (
    <div className="flex items-center justify-between py-2 text-[0.85rem] text-dim">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
          checked ? 'border-(--accent) bg-(--accent)' : 'border-line bg-bg'
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] size-3.5 rounded-full transition-transform ${
            checked ? 'translate-x-4 bg-bg' : 'bg-dim'
          }`}
        />
      </button>
    </div>
  )
}
