interface Props<T extends string> {
  options: ReadonlyArray<readonly [T, string]>
  value: T
  onChange: (value: T) => void
}

/** Control segmentado (grupo de botones excluyentes). */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-line bg-bg">
      {options.map(([val, label]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`flex-1 cursor-pointer px-1 py-2 text-[0.78rem] transition-colors ${
            val === value ? 'bg-hover text-(--accent)' : 'text-dim hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
