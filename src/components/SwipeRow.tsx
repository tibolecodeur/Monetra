import { Trash2 } from 'lucide-react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'
import { haptic, project, rubberband, SPRINGS } from '../lib/motion'
import { useHorizontalDrag } from '../lib/useHorizontalDrag'

interface Props {
  /** Nom lu par les lecteurs d'écran pour l'action révélée. */
  label: string
  onDelete: () => void
  children: ReactNode
}

/** Part de la largeur à dépasser (position projetée) pour supprimer. */
const THRESHOLD = 0.45

/**
 * Ligne de liste supprimable d'un glissement vers la gauche : suivi 1:1, rubber-band
 * aux deux extrémités, seuil avec retour haptique, décision par projection du momentum.
 * L'alternative sans geste reste le bouton « Supprimer » de la feuille d'édition.
 */
export function SwipeRow({ label, onDelete, children }: Props) {
  const x = useMotionValue(0)
  const content = useRef<HTMLDivElement>(null)
  const animation = useRef<AnimationPlaybackControls | null>(null)
  const reduced = useReducedMotion()
  const [armed, setArmed] = useState(false)
  const width = () => content.current?.offsetWidth || 360

  // L'action se révèle et grandit dans la direction du geste.
  const actionOpacity = useTransform(x, [-48, -8], [1, 0])
  // Le fond rouge n'occupe que la zone découverte (la ligne est translucide sur sa carte) :
  // un clip-path, pas une largeur, pour ne pas refaire la mise en page à chaque image du geste.
  const actionClip = useTransform(x, (v) => `inset(0 0 0 calc(100% - ${Math.max(0, -v)}px))`)

  useMotionValueEvent(x, 'change', (v) => {
    const next = v < -width() * THRESHOLD
    if (next !== armed) {
      setArmed(next)
      if (next) haptic()
    }
  })

  const to = (target: number, velocity: number, onComplete?: () => void) => {
    animation.current?.stop()
    const transition = reduced
      ? { duration: 0 }
      : Math.abs(velocity) > 100 && !onComplete
        ? SPRINGS.flick(velocity)
        : SPRINGS.move(velocity)
    animation.current = animate(x, target, { ...transition, onComplete })
  }

  const handlers = useHorizontalDrag({
    x,
    onGrab: () => animation.current?.stop(),
    map: (raw) => {
      const w = width()
      if (raw > 0) return rubberband(raw, w)
      if (raw < -w) return -w + rubberband(raw + w, w)
      return raw
    },
    onRelease: (velocity) => {
      const w = width()
      const projected = x.get() + project(velocity)
      const commit = velocity < 300 && projected < -w * THRESHOLD
      if (commit) {
        haptic([6, 30, 6])
        to(-w, velocity, onDelete)
      } else to(0, velocity)
    },
  })

  return (
    <div className="swipe-row">
      <motion.div className={`swipe-action${armed ? ' armed' : ''}`} style={{ opacity: actionOpacity, clipPath: actionClip }} aria-hidden="true">
        <span className="swipe-action-icon">
          <Trash2 size={20} />
        </span>
        <span>Supprimer</span>
      </motion.div>
      <motion.div ref={content} className="swipe-content" style={{ x }} {...handlers} data-swipe-label={label}>
        {children}
      </motion.div>
    </div>
  )
}
