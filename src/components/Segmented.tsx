import { motion } from 'motion/react'
import { useId } from 'react'
import { SPRINGS } from '../lib/motion'

interface Props<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}

/**
 * Contrôle segmenté : le curseur est rendu dans l'option choisie et partage un `layoutId`,
 * Motion l'anime d'une option à l'autre (spring critique, interruptible). Aucun calcul de largeur
 * ni de position : le curseur prend toujours la boîte exacte de l'option.
 */
export function Segmented<T extends string>({ value, options, onChange, label }: Props<T>) {
  // Unique par instance : deux segmented à l'écran ne se partagent pas le curseur.
  const thumbId = useId()
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={active ? 'active' : undefined}
            onClick={() => onChange(o.value)}
          >
            {active && (
              <motion.span
                className="segment-thumb"
                layoutId={thumbId}
                transition={SPRINGS.segment()}
                aria-hidden="true"
              />
            )}
            <span className="segment-label">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
