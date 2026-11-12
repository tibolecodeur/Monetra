import { motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { packBubbles, BUBBLES_WIDTH as WIDTH, type BubbleItem as Item } from '../lib/bubbles'
import { getCategory } from '../lib/categories'
import { SPRINGS } from '../lib/motion'
import { CategoryIcon } from './CategoryIcon'

const percent = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 })

/**
 * Bulles des dépenses par catégorie : la taille dit le poids, l'arc la part du total.
 * Décoratif pour les lecteurs d'écran : la même information est donnée en liste juste en dessous.
 */
export function CategoryBubbles({ items }: { items: Item[] }) {
  const { bubbles, height } = useMemo(() => packBubbles(items), [items])
  const reduced = useReducedMotion()
  if (!bubbles.length) return null
  // Une dépense ajoutée ou modifiée : les bulles glissent et grossissent vers leur nouvelle place
  // (spring critique). Jamais au chargement (initial={false}) ; directement en mouvement réduit.
  const transition = reduced ? { duration: 0 } : SPRINGS.data()
  return (
    <motion.svg
      className="bubbles"
      initial={false}
      animate={{ viewBox: `0 0 ${WIDTH} ${height}` }}
      transition={transition}
      aria-hidden="true"
      data-testid="bubbles"
    >
      {bubbles.map((b) => {
        const big = b.r >= 46
        const icon = big ? 20 : 16
        // Contenu centré verticalement autour du centre de la bulle : icône, libellé (grandes bulles), pourcentage.
        const top = -(big ? 26 : 16)
        return (
          <motion.g
            key={b.categorie}
            className={`bubble tint-${b.categorie}`}
            initial={false}
            animate={{ x: b.x, y: b.y }}
            transition={transition}
          >
            <motion.circle className="bubble-disc" cx={0} cy={0} initial={false} animate={{ r: b.r }} transition={transition} />
            <motion.circle
              className="bubble-arc"
              cx={0}
              cy={0}
              pathLength={100}
              transform="rotate(-90)"
              initial={false}
              animate={{ r: b.r - 1.5, strokeDasharray: `${Math.max(b.share * 100, 1.5)} 100` }}
              transition={transition}
            />
            <svg x={-icon / 2} y={top} width={icon} height={icon} className="bubble-icon" overflow="visible">
              <CategoryIcon categorie={b.categorie} size={icon} />
            </svg>
            {big && (
              <text className="bubble-label" x={0} y={top + icon + 15} textAnchor="middle">
                {getCategory(b.categorie).label}
              </text>
            )}
            <text className="bubble-value" x={0} y={top + icon + (big ? 33 : 17)} textAnchor="middle">
              {percent.format(b.share)}
            </text>
          </motion.g>
        )
      })}
    </motion.svg>
  )
}
