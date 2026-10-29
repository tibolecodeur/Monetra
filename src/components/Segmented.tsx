import { motion } from 'motion/react'
import { useId } from 'react'
import { SPRINGS } from '../lib/motion'

interface Props<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}

/** Contrôle segmenté : l'indicateur glisse en spring vers l'option choisie. */
export function Segmented<T extends string>({ value, options, onChange, label }: Props<T>) {
  const id = useId()
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'active' : undefined}
          onClick={() => onChange(o.value)}
        >
          {value === o.value && (
            <motion.span layoutId={`segment-${id}`} className="segment-indicator" transition={SPRINGS.default()} />
          )}
          <span className="segment-label">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
