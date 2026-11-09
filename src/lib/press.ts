import { animate } from 'motion/react'
import { GESTURE_SLOP, prefersReducedMotion, SPRINGS } from './motion'

/**
 * Retour visuel au pointer-down (pas au relâcher) pour tous les éléments touchables.
 * - boutons, puces, onglets : légère réduction d'échelle en spring ;
 * - lignes de liste : surlignage immédiat (data-pressed), comme les cellules iOS.
 * Le retour est annulé si le doigt bouge au-delà du seuil (défilement, glissement).
 */
const SELECTOR = 'button, [role="radio"], a[href], .pressable'
const HIGHLIGHT_ONLY = '.row, .month-label, .tab, .swipe-content'

export function installPressFeedback(): () => void {
  let active: HTMLElement | null = null
  let scaled = false
  let startX = 0
  let startY = 0

  const release = () => {
    if (!active) return
    const el = active
    active = null
    delete el.dataset.pressed
    if (scaled) animate(el, { scale: 1 }, SPRINGS.press())
  }

  const onDown = (e: PointerEvent) => {
    if (e.button > 0) return
    const el = (e.target as Element | null)?.closest<HTMLElement>(SELECTOR)
    if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return
    release()
    active = el
    startX = e.clientX
    startY = e.clientY
    el.dataset.pressed = 'true'
    scaled = !el.matches(HIGHLIGHT_ONLY) && !prefersReducedMotion()
    if (scaled) animate(el, { scale: 0.97 }, SPRINGS.press())
  }

  const onMove = (e: PointerEvent) => {
    if (active && Math.hypot(e.clientX - startX, e.clientY - startY) > GESTURE_SLOP) release()
  }

  document.addEventListener('pointerdown', onDown, { capture: true, passive: true })
  document.addEventListener('pointermove', onMove, { capture: true, passive: true })
  document.addEventListener('pointerup', release, { capture: true, passive: true })
  document.addEventListener('pointercancel', release, { capture: true, passive: true })
  return () => {
    document.removeEventListener('pointerdown', onDown, { capture: true })
    document.removeEventListener('pointermove', onMove, { capture: true })
    document.removeEventListener('pointerup', release, { capture: true })
    document.removeEventListener('pointercancel', release, { capture: true })
  }
}
