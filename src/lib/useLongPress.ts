import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'
import { GESTURE_SLOP } from './motion'

/** Durée d'appui avant d'ouvrir le menu (iOS ≈ 0,5 s). */
const DELAY = 450

/**
 * Appui long (toucher) ou clic droit / touche Menu (souris, clavier) : appelle `onLongPress` avec l'élément.
 * Annulé dès que le doigt bouge de plus de 10 px (défilement, glissement d'une ligne).
 * Le clic qui suit un appui long est avalé : l'appui long ne doit pas aussi ouvrir la fiche.
 * Les mouvements sont écoutés sur la fenêtre : un geste parent (swipe) peut capturer le pointeur.
 */
export function useLongPress<T extends HTMLElement>(onLongPress: (el: T) => void) {
  const fired = useRef(false)
  const cleanup = useRef<(() => void) | null>(null)
  useEffect(() => () => cleanup.current?.(), [])

  const open = (el: T) => {
    fired.current = true
    onLongPress(el)
  }

  return {
    onPointerDown: (e: PointerEvent<T>) => {
      fired.current = false
      cleanup.current?.()
      if (e.pointerType === 'mouse') return // souris : le clic droit passe par onContextMenu
      const el = e.currentTarget
      const x0 = e.clientX
      const y0 = e.clientY
      const timer = window.setTimeout(() => {
        cleanup.current?.()
        open(el)
      }, DELAY)
      const move = (ev: globalThis.PointerEvent) => {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > GESTURE_SLOP) cleanup.current?.()
      }
      const end = () => cleanup.current?.()
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', end)
      window.addEventListener('pointercancel', end)
      window.addEventListener('scroll', end, { passive: true })
      cleanup.current = () => {
        window.clearTimeout(timer)
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', end)
        window.removeEventListener('pointercancel', end)
        window.removeEventListener('scroll', end)
        cleanup.current = null
      }
    },
    onContextMenu: (e: MouseEvent<T>) => {
      e.preventDefault()
      // Android émet aussi « contextmenu » à l'appui long : on n'ouvre qu'une fois.
      if (fired.current) return
      cleanup.current?.()
      open(e.currentTarget)
    },
    onClickCapture: (e: MouseEvent<T>) => {
      if (!fired.current) return
      fired.current = false
      e.preventDefault()
      e.stopPropagation()
    },
  }
}
