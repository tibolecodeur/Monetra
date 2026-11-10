interface Props<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}

/** Contrôle segmenté façon iOS : le curseur glisse vers l'option choisie (transition CSS, interruptible). */
export function Segmented<T extends string>({ value, options, onChange, label }: Props<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      <span
        className="segment-thumb"
        aria-hidden="true"
        // 4 px : les marges du rail. translateX en % est relatif à la largeur du curseur.
        style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'active' : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
