import { useMemo } from 'react'
import { packBubbles, BUBBLES_WIDTH as WIDTH, type BubbleItem as Item } from '../lib/bubbles'
import { getCategory } from '../lib/categories'
import { CategoryIcon } from './CategoryIcon'

const percent = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 })

/**
 * Bulles des dépenses par catégorie : la taille dit le poids, l'arc la part du total.
 * Décoratif pour les lecteurs d'écran : la même information est donnée en liste juste en dessous.
 */
export function CategoryBubbles({ items }: { items: Item[] }) {
  const { bubbles, height } = useMemo(() => packBubbles(items), [items])
  if (!bubbles.length) return null
  return (
    <svg className="bubbles" viewBox={`0 0 ${WIDTH} ${height}`} aria-hidden="true" data-testid="bubbles">
      {bubbles.map((b) => {
        const big = b.r >= 46
        const icon = big ? 20 : 16
        // Contenu centré verticalement : icône, libellé (grandes bulles), pourcentage.
        const top = b.y - (big ? 26 : 16)
        return (
          <g key={b.categorie} className={`bubble tint-${b.categorie}`}>
            <circle className="bubble-disc" cx={b.x} cy={b.y} r={b.r} />
            <circle
              className="bubble-arc"
              cx={b.x}
              cy={b.y}
              r={b.r - 1.5}
              pathLength={100}
              strokeDasharray={`${Math.max(b.share * 100, 1.5)} 100`}
              transform={`rotate(-90 ${b.x} ${b.y})`}
            />
            <svg x={b.x - icon / 2} y={top} width={icon} height={icon} className="bubble-icon" overflow="visible">
              <CategoryIcon categorie={b.categorie} size={icon} />
            </svg>
            {big && (
              <text className="bubble-label" x={b.x} y={top + icon + 15} textAnchor="middle">
                {getCategory(b.categorie).label}
              </text>
            )}
            <text className="bubble-value" x={b.x} y={top + icon + (big ? 33 : 17)} textAnchor="middle">
              {percent.format(b.share)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
