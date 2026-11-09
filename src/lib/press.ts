import { animate } from 'motion/react'
import { GESTURE_SLOP, prefersReducedMotion, spring, SPRINGS } from './motion'

/**
 * Retour visuel au pointer-down (pas au relâcher) pour tous les éléments touchables.
 * - boutons, puces, onglets : légère réduction d'échelle en spring ;
 * - lignes de liste : surlignage immédiat (data-pressed), comme les cellules iOS ;
 * - verre interactif (.glass-press, glassEffect(.interactive()) chez Apple) : le verre gonfle
 *   légèrement sous le doigt, la lumière naît au point de contact, puis il rebondit au relâcher.
 * Le retour est annulé si le doigt bouge au-delà du seuil (défilement, glissement).
 */
const SELECTOR = 'button, [role="radio"], a[href], .pressable'
const HIGHLIGHT_ONLY = '.row, .month-label, .tab, .swipe-content'

export function installPressFeedback(): () => void {
  let active: HTMLElement | null = null
  let scaled = false
  let glass = false
  let startX = 0
  let startY = 0

  const release = () => {
    if (!active) return
    const el = active
    active = null
    delete el.dataset.pressed
    if (scaled) animate(el, { scale: 1 }, glass ? spring(0.55, 0.42) : SPRINGS.press())
  }

  const onDown = (e: PointerEvent) => {
    if (e.button > 0) return
    const el = (e.target as Element | null)?.closest<HTMLElement>(SELECTOR)
    if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return
    release()
    // Bouton qui remplit une surface de verre : c'est le verre entier qui réagit.
    const glassTarget = el.closest<HTMLElement>('.glass-press')
    const target = glassTarget ?? el
    glass = Boolean(glassTarget)
    active = target
    startX = e.clientX
    startY = e.clientY
    target.dataset.pressed = 'true'
    scaled = !el.matches(HIGHLIGHT_ONLY) && !prefersReducedMotion()
    if (glass) {
      const box = target.getBoundingClientRect()
      target.style.setProperty('--lg-x', `${e.clientX - box.left}px`)
      target.style.setProperty('--lg-y', `${e.clientY - box.top}px`)
    }
    // Le verre gonfle d'autant moins qu'il est grand (≈ 4 px sur le plus grand côté).
    const grow = glass ? 1 + 4 / Math.max(target.offsetWidth, target.offsetHeight, 1) : 0.97
    if (scaled) animate(target, { scale: grow }, SPRINGS.press())
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
