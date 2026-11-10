import { animate, useMotionValue, useTransform, useVelocity, type MotionValue } from 'motion/react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import { GESTURE_SLOP, haptic, prefersReducedMotion, project, rubberband, spring, SPRINGS, VelocityTracker } from './motion'

interface Options {
  /** Nombre de segments (onglets, options). */
  count: number
  /** Segment sélectionné. */
  index: number
  onSelect: (index: number) => void
  /** Rail que la lentille parcourt : sa largeur est partagée entre les segments. */
  track: RefObject<HTMLElement | null>
}

export interface SelectionLens {
  /** Position (px) et largeur d'un segment. */
  x: MotionValue<number>
  width: number
  scaleX: MotionValue<number>
  scaleY: MotionValue<number>
  /** 0 au repos, 1 doigt posé ou en plein mouvement : pilote la réfraction de la lentille. */
  intensity: MotionValue<number>
  /** Segment sous le doigt pendant un glissement. */
  hover: number | null
  /** Lentille soulevée (doigt posé). */
  lifted: boolean
  bind: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void
    onClickCapture: (e: MouseEvent<HTMLElement>) => void
  }
}

/**
 * Lentille de sélection façon iOS 26 (tab bar, contrôle segmenté) :
 * - elle glisse en spring vers le segment choisi ;
 * - doigt posé, elle se soulève (grossit) ; on peut la faire glisser d'un segment à l'autre,
 *   suivi 1:1 avec rubber-band aux extrémités ; au relâcher, la projection du momentum choisit
 *   le segment et la vélocité du doigt passe au spring ;
 * - elle s'étire dans le sens du mouvement, proportionnellement à sa vitesse (matière liquide).
 */
export function useSelectionLens({ count, index, onSelect, track }: Options): SelectionLens {
  const [width, setWidth] = useState(0)
  const x = useMotionValue(0)
  const lift = useMotionValue(0)
  const velocity = useVelocity(x)
  const stretch = useTransform(velocity, (v) => Math.min(0.28, Math.abs(v) / 4500))
  const scaleX = useTransform(() => (1 + 0.1 * lift.get()) * (1 + stretch.get()))
  const scaleY = useTransform(() => (1 + 0.16 * lift.get()) * (1 - 0.35 * stretch.get()))
  const intensity = useTransform(() => Math.min(1, lift.get() + stretch.get() * 5))
  const [hover, setHover] = useState<number | null>(null)
  const [lifted, setLifted] = useState(false)
  const drag = useRef<{ id: number; start: number; from: number; active: boolean } | null>(null)
  const dragged = useRef(false)
  const tracker = useRef(new VelocityTracker())
  const widthRef = useRef(0)

  useLayoutEffect(() => {
    const node = track.current
    if (!node) return
    const read = () => {
      const w = node.clientWidth / Math.max(1, count)
      widthRef.current = w
      setWidth(w)
    }
    read()
    const observer = new ResizeObserver(read)
    observer.observe(node)
    return () => observer.disconnect()
  }, [track, count])

  // Le segment choisi change (toucher, clavier, navigation) : la lentille y glisse.
  const first = useRef(true)
  useLayoutEffect(() => {
    if (!width || drag.current?.active) return
    const target = index * width
    if (first.current || prefersReducedMotion()) {
      first.current = false
      x.jump(target)
      return
    }
    const controls = animate(x, target, SPRINGS.default(x.getVelocity()))
    return () => controls.stop()
  }, [index, width, x])

  const setLift = useCallback(
    (on: boolean) => {
      setLifted(on)
      if (prefersReducedMotion()) lift.jump(on ? 1 : 0)
      // Au relâcher, le verre retombe avec un léger rebond (glassEffect(.interactive())).
      else animate(lift, on ? 1 : 0, on ? SPRINGS.press() : spring(0.55, 0.42))
    },
    [lift],
  )

  useEffect(() => () => lift.stop(), [lift])

  const clampIndex = (i: number) => Math.max(0, Math.min(count - 1, i))

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button > 0 || count < 2) return
    x.stop()
    dragged.current = false
    drag.current = { id: e.pointerId, start: e.clientX, from: x.get(), active: false }
    tracker.current.reset()
    tracker.current.add(e.clientX, 0, e.timeStamp)
    // La lentille ne se soulève que si le doigt est posé sur le segment choisi (comme iOS 26).
    const box = e.currentTarget.getBoundingClientRect()
    const under = Math.floor((e.clientX - box.left) / Math.max(1, widthRef.current))
    if (under === index) setLift(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.active) {
      if (Math.abs(e.clientX - d.start) < GESTURE_SLOP) return
      d.active = true
      dragged.current = true
      d.start = e.clientX
      e.currentTarget.setPointerCapture(e.pointerId)
      setLift(true)
    }
    tracker.current.add(e.clientX, 0, e.timeStamp)
    const max = (count - 1) * widthRef.current
    const raw = d.from + (e.clientX - d.start)
    const pos = raw < 0 ? rubberband(raw, widthRef.current) : raw > max ? max + rubberband(raw - max, widthRef.current) : raw
    x.set(pos)
    const next = clampIndex(Math.round(pos / Math.max(1, widthRef.current)))
    if (next !== hover) {
      if (hover !== null) haptic(6)
      setHover(next)
    }
  }

  const end = (e: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    setLift(false)
    setHover(null)
    if (!d.active) return
    const v = cancelled ? 0 : tracker.current.velocity(e.timeStamp).x
    // Rail court : décélération plus forte qu'un défilement pour que la projection reste à l'échelle.
    const target = clampIndex(Math.round((x.get() + project(v, 0.99)) / Math.max(1, widthRef.current)))
    if (prefersReducedMotion()) x.jump(target * widthRef.current)
    else animate(x, target * widthRef.current, Math.abs(v) > 100 ? SPRINGS.flick(v) : SPRINGS.default(v))
    if (target !== index) onSelect(target)
  }

  return {
    x,
    width,
    scaleX,
    scaleY,
    intensity,
    hover,
    lifted,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e) => end(e, false),
      onPointerCancel: (e) => end(e, true),
      // Pas de clic après un glissement : la sélection est déjà faite.
      onClickCapture: (e) => {
        if (!dragged.current) return
        dragged.current = false
        e.preventDefault()
        e.stopPropagation()
      },
    },
  }
}
