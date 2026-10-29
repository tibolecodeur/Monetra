import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect } from 'react'
import { formatMoney, round2 } from '../lib/format'
import { SPRINGS } from '../lib/motion'

/**
 * Montant qui glisse vers sa nouvelle valeur en spring quand il change.
 * Les lecteurs d'écran ne lisent que la valeur finale ; les chiffres tabulaires évitent les sauts.
 */
export function AnimatedAmount({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => formatMoney(round2(v)))

  useEffect(() => {
    if (reduced) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, SPRINGS.number())
    return () => controls.stop()
  }, [value, reduced, mv])

  return (
    <p className={className} data-value={value}>
      <motion.span aria-hidden="true">{text}</motion.span>
      <span className="sr-only">{formatMoney(value)}</span>
    </p>
  )
}
