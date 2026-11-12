import { describe, expect, it } from 'vitest'
import { BUBBLES_WIDTH, packBubbles } from './bubbles'

const items = [
  { categorie: 'logement' as const, total: 520 },
  { categorie: 'courses' as const, total: 117.05 },
  { categorie: 'abonnements' as const, total: 59.13 },
  { categorie: 'resto' as const, total: 46.5 },
  { categorie: 'loisirs' as const, total: 39.9 },
  { categorie: 'divers' as const, total: 21.4 },
]

describe('packBubbles', () => {
  it('ne fait se chevaucher aucune bulle et reste dans la largeur', () => {
    const { bubbles, height } = packBubbles(items)
    expect(bubbles).toHaveLength(items.length)
    for (const [i, a] of bubbles.entries()) {
      expect(a.x - a.r).toBeGreaterThanOrEqual(-0.01)
      expect(a.x + a.r).toBeLessThanOrEqual(BUBBLES_WIDTH + 0.01)
      expect(a.y + a.r).toBeLessThanOrEqual(height + 0.01)
      for (const b of bubbles.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r)
    }
  })

  it('donne une aire plus grande au plus gros poste, et des parts qui somment à 1', () => {
    const { bubbles } = packBubbles(items)
    expect(bubbles[0].categorie).toBe('logement')
    expect(Math.max(...bubbles.map((b) => b.r))).toBe(bubbles[0].r)
    expect(bubbles.reduce((s, b) => s + b.share, 0)).toBeCloseTo(1)
  })

  it('ne dessine rien sans dépense', () => {
    expect(packBubbles([]).bubbles).toEqual([])
  })
})
