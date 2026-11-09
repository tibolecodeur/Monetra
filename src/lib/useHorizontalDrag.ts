import type { MotionValue } from 'motion/react'
import { useRef, type MouseEvent, type PointerEvent } from 'react'
import { GESTURE_SLOP, VelocityTracker } from './motion'

interface Options {
  x: MotionValue<number>
  /** Appelé au toucher : stoppe toute animation en cours (interruption). */
  onGrab?: () => void
  /** Convertit le déplacement brut (px) en position affichée (ex. rubber-band). */
  map?: (raw: number) => number
  onRelease: (velocity: number) => void
}

/**
 * Glissement horizontal suivi 1:1 : verrouillage de direction après un petit seuil
 * (le défilement vertical reste au navigateur grâce à `touch-action: pan-y`),
 * capture du pointeur, vélocité au relâcher, clic annulé après un glissement.
 */
export function useHorizontalDrag({ x, onGrab, map = (v) => v, onRelease }: Options) {
  const state = useRef<{ id: number; sx: number; sy: number; startX: number; locked: 'h' | 'v' | null } | null>(null)
  const tracker = useRef(new VelocityTracker())
  const dragged = useRef(false)

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button > 0) return
    onGrab?.()
    dragged.current = false
    state.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, startX: x.get(), locked: null }
    tracker.current.reset()
    tracker.current.add(e.clientX, e.clientY)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const s = state.current
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.sx
    const dy = e.clientY - s.sy
    if (!s.locked) {
      if (Math.abs(dx) < GESTURE_SLOP && Math.abs(dy) < GESTURE_SLOP) return
      s.locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      if (s.locked === 'v') return
      dragged.current = true
      // On repart de la position actuelle du doigt : pas de saut au moment du verrouillage.
      s.sx = e.clientX
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (s.locked !== 'h') return
    tracker.current.add(e.clientX, e.clientY)
    x.set(map(s.startX + (e.clientX - s.sx)))
  }

  const onPointerEnd = (e: PointerEvent<HTMLElement>) => {
    const s = state.current
    if (!s || s.id !== e.pointerId) return
    state.current = null
    if (s.locked !== 'h') {
      if (x.get() !== s.startX) onRelease(0)
      return
    }
    onRelease(e.type === 'pointercancel' ? 0 : tracker.current.velocity().x)
  }

  const onClickCapture = (e: MouseEvent) => {
    if (!dragged.current) return
    e.preventDefault()
    e.stopPropagation()
    dragged.current = false
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    onClickCapture,
  }
}
