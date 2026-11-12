import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect } from 'react'
import { formatMoney, round2, splitMoney } from '../lib/format'
import { SPRINGS } from '../lib/motion'

/**
 * Montant qui glisse vers sa nouvelle valeur en spring quand il change.
 * Les lecteurs d'écran ne lisent que la valeur finale ; les chiffres tabulaires évitent les sauts.
 */
export function AnimatedAmount({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(value)
  const units = useTransform(mv, (v) => splitMoney(formatMoney(round2(v)))[0])
  const cents = useTransform(mv, (v) => splitMoney(formatMoney(round2(v)))[1])

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
      <span aria-hidden="true">
        <motion.span>{units}</motion.span>
        <motion.span className="cents">{cents}</motion.span>
      </span>
      <span className="sr-only">{formatMoney(value)}</span>
    </p>
  )
}

/** Montant statique avec les centimes estompés. */
export function Money({ value, sign = '' }: { value: number; sign?: string }) {
  const [units, cents] = splitMoney(formatMoney(value))
  return (
    <>
      {sign}
      {units}
      <span className="cents">{cents}</span>
    </>
  )
}
