import { useReducedMotion } from 'motion/react'
import { useCallback, type ElementType } from 'react'
import { formatMoney, round2, splitMoney } from '../lib/format'
import CountUp from './CountUp'

/** Durée du compteur : assez pour se lire, assez courte pour ne pas faire attendre. */
const COUNT_DURATION = 0.8

interface Props {
  value: number
  className?: string
  /** Signe affiché devant (« + », « − »), la valeur restant positive. */
  sign?: string
  /** Élément conteneur : un paragraphe par défaut, un span dans une ligne de texte. */
  as?: ElementType
}

/**
 * Montant clé qui compte jusqu'à sa valeur (CountUp de React Bits) : à l'arrivée à l'écran, depuis 0,
 * puis depuis la valeur affichée à chaque changement. Format fr-FR, centimes estompés.
 * En mouvement réduit, la valeur s'affiche directement. Les lecteurs d'écran ne lisent que la valeur finale.
 */
export function AnimatedAmount({ value, className, sign = '', as: Tag = 'p' }: Props) {
  const reduced = useReducedMotion()
  const formatter = useCallback(
    (v: number): [string, string] => {
      const [units, cents] = splitMoney(formatMoney(round2(v)))
      return [sign + units, cents]
    },
    [sign],
  )
  return (
    <Tag className={className} data-value={value}>
      <span aria-hidden="true">
        <CountUp
          to={value}
          from={reduced ? value : 0}
          duration={COUNT_DURATION}
          formatter={formatter}
          tailClassName="cents"
        />
      </span>
      <span className="sr-only">
        {sign}
        {formatMoney(value)}
      </span>
    </Tag>
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
