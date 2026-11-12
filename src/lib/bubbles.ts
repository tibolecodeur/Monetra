import type { CategoryId } from './types'

export interface BubbleItem {
  categorie: CategoryId
  total: number
}

export interface Bubble extends BubbleItem {
  share: number
  r: number
  x: number
  y: number
}

export const BUBBLES_WIDTH = 340
const WIDTH = BUBBLES_WIDTH
const GAP = 8
const R_MIN = 30
const R_MAX = 78


/**
 * Place les bulles du plus grand au plus petit : chacune prend la première position libre sur une
 * spirale aplatie autour du centre (plus large que haute, pour remplir l'écran d'un téléphone).
 * Déterministe : les mêmes chiffres donnent toujours le même dessin.
 */
export function packBubbles(items: BubbleItem[]): { bubbles: Bubble[]; height: number } {
  const sum = items.reduce((s, i) => s + i.total, 0)
  if (!sum) return { bubbles: [], height: 0 }
  const max = Math.max(...items.map((i) => i.total))
  const placed: Bubble[] = []
  for (const item of [...items].sort((a, b) => b.total - a.total)) {
    // Aire proportionnelle au montant, avec un plancher pour garder l'icône lisible.
    const r = R_MIN + (R_MAX - R_MIN) * Math.sqrt(item.total / max)
    let x = 0
    let y = 0
    for (let k = 0; placed.length > 0 && k < 4000; k++) {
      const a = k * 0.25
      const d = k * 0.5
      x = Math.cos(a) * d * 1.45
      y = Math.sin(a) * d * 0.8
      if (placed.every((p) => Math.hypot(p.x - x, p.y - y) >= p.r + r + GAP)) break
    }
    placed.push({ ...item, share: item.total / sum, r, x, y })
  }
  const minX = Math.min(...placed.map((b) => b.x - b.r))
  const maxX = Math.max(...placed.map((b) => b.x + b.r))
  const minY = Math.min(...placed.map((b) => b.y - b.r))
  const maxY = Math.max(...placed.map((b) => b.y + b.r))
  // Ramené à la largeur du dessin (jamais agrandi au-delà de 1,15 : une seule bulle reste mesurée).
  const scale = Math.min(1.15, (WIDTH - 4) / (maxX - minX))
  const offsetX = (WIDTH - (maxX - minX) * scale) / 2
  const bubbles = placed.map((b) => ({
    ...b,
    r: b.r * scale,
    x: offsetX + (b.x - minX) * scale,
    y: 2 + (b.y - minY) * scale,
  }))
  return { bubbles, height: (maxY - minY) * scale + 4 }
}
