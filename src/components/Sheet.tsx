import { X } from 'lucide-react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type Transition,
} from 'motion/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { SceneContext } from '../lib/glass/react'
import { GlassRim } from './Glass'
import { GESTURE_SLOP, project, REDUCED_FADE, rubberband, SPRINGS, VelocityTracker } from '../lib/motion'

interface Props {
  title: string
  onClose: () => void
  /** Reçoit `dismiss`, qui ferme la feuille avec son animation avant de démonter. */
  children: (dismiss: () => void) => ReactNode
}

const SheetDismissContext = createContext<() => void>(() => {})

/** Donne au contenu la fonction de fermeture animée. */
function SheetContent({ render }: { render: (dismiss: () => void) => ReactNode }) {
  return render(useContext(SheetDismissContext))
}

/** Au-delà de cette vélocité (px/s), c'est le sens du geste qui décide, pas la position. */
const FLICK_VELOCITY = 300

export function Sheet({ title, onClose, children }: Props) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const initialHeight = typeof window === 'undefined' ? 800 : window.innerHeight
  // Hauteur de la feuille, tenue à jour par un ResizeObserver.
  const height = useMotionValue(initialHeight)
  const y = useMotionValue(reduced ? 0 : initialHeight)
  const fade = useMotionValue(reduced ? 0 : 1)
  // Le voile suit la progression du geste (et le fondu en mouvement réduit).
  const scrimOpacity = useTransform(() => Math.min(1, Math.max(0, 1 - y.get() / height.get())) * fade.get())
  const animation = useRef<AnimationPlaybackControls | null>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const run = useCallback(
    (value: typeof y, target: number, transition: Transition, onComplete?: () => void) => {
      animation.current?.stop()
      animation.current = animate(value, target, { ...transition, onComplete })
    },
    [],
  )

  const dismiss = useCallback(
    (velocity = 0) => {
      // Pendant la fermeture, l'écran dessous redevient touchable : aucune transition ne bloque l'entrée.
      // En fondu (mouvement réduit), la feuille reste en place : elle devient aussi traversable.
      if (layer.current) layer.current.dataset.closing = reduced ? 'fade' : 'slide'
      const done = () => onCloseRef.current()
      if (reduced) run(fade, 0, REDUCED_FADE, done)
      // Fermeture vers le bas : même chemin qu'à l'ouverture, vélocité du doigt conservée.
      else run(y, height.get(), SPRINGS.move(Math.max(velocity, 0)), done)
    },
    [reduced, run, fade, y, height],
  )

  // Ouverture : la feuille monte depuis le bas de l'écran (spring critique, aucun élan).
  useEffect(() => {
    const el = panel.current
    if (!el) return
    const measure = () => height.set(el.offsetHeight || height.get())
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (reduced) run(fade, 1, REDUCED_FADE)
    else {
      y.set(height.get())
      run(y, 0, SPRINGS.default())
    }
    return () => {
      observer.disconnect()
      animation.current?.stop()
    }
  }, [reduced, run, y, fade, height])

  // Échap, focus piégé, défilement de la page bloqué.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return dismiss()
      if (e.key !== 'Tab' || !panel.current) return
      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
      )
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
      previous?.focus?.()
    }
  }, [dismiss])

  // Glissement 1:1 depuis la poignée et l'en-tête.
  const drag = useRef<{ pointerId: number; startPointer: number; startY: number; active: boolean } | null>(null)
  const tracker = useRef(new VelocityTracker())
  const dragged = useRef(false)

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button > 0) return
    // Interruptible : on attrape la feuille là où elle est, même en pleine animation.
    animation.current?.stop()
    if (layer.current) delete layer.current.dataset.closing
    dragged.current = false
    drag.current = { pointerId: e.pointerId, startPointer: e.clientY, startY: y.get(), active: false }
    tracker.current.reset()
    tracker.current.add(0, e.clientY, e.timeStamp)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    if (!d.active) {
      if (Math.abs(e.clientY - d.startPointer) < GESTURE_SLOP) return
      d.active = true
      dragged.current = true
      d.startPointer = e.clientY
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    tracker.current.add(0, e.clientY, e.timeStamp)
    const raw = d.startY + (e.clientY - d.startPointer)
    // Vers le haut, il n'y a rien : résistance progressive (rubber-band).
    y.set(raw >= 0 ? raw : rubberband(raw, height.get()))
  }

  const onPointerEnd = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    drag.current = null
    if (!d.active) {
      // Simple toucher : si on avait interrompu une animation, on la termine proprement.
      if (y.get() !== 0) run(y, 0, SPRINGS.default())
      return
    }
    const velocity = e.type === 'pointercancel' ? 0 : tracker.current.velocity(e.timeStamp).y
    const current = y.get()
    const projected = current + project(velocity)
    const shouldClose =
      Math.abs(velocity) > FLICK_VELOCITY ? velocity > 0 : projected > height.get() * 0.4
    if (shouldClose) dismiss(velocity)
    else run(y, 0, Math.abs(velocity) > 100 ? SPRINGS.sheet(velocity) : SPRINGS.default(velocity))
  }

  // Empêche le clic (ex. sur « Fermer ») qui suit un glissement.
  const onClickCapture = (e: MouseEvent) => {
    if (!dragged.current) return
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div ref={layer} className="sheet-layer">
      <motion.div className="sheet-scrim" style={{ opacity: scrimOpacity }} onClick={() => dismiss()} aria-hidden="true" />
      <motion.div
        ref={panel}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ y, opacity: fade }}
        data-testid="sheet"
      >
        {/* Sheet partielle iOS 26 : verre flottant, décollé des bords, avec son liseré. */}
        <GlassRim radius={34} />
        <div
          className="sheet-grabber"
          data-testid="sheet-grabber"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClickCapture={onClickCapture}
        >
          <div className="sheet-handle" aria-hidden="true" />
          <header className="sheet-header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-button" onClick={() => dismiss()} aria-label="Fermer">
              <X size={22} aria-hidden="true" />
            </button>
          </header>
        </div>
        <div className="sheet-body">
          {/* Rien de la scène ne passe sous la feuille : son verre est un matériau, sans lentille. */}
          <SceneContext.Provider value={null}>
            <SheetDismissContext.Provider value={dismiss}>
              <SheetContent render={children} />
            </SheetDismissContext.Provider>
          </SceneContext.Provider>
        </div>
      </motion.div>
    </div>
  )
}
