import { animate, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from 'motion/react'
import { useRef, type RefObject } from 'react'
import { addMonths, type MonthKey } from './dates'
import { project, REDUCED_FADE, SPRINGS } from './motion'
import { useHorizontalDrag } from './useHorizontalDrag'

/**
 * Changement de mois par glissement horizontal : le contenu suit le doigt, la projection
 * du momentum décide s'il faut changer de mois (snap) ou revenir. Le mois suivant entre
 * par le côté opposé, dans la continuité du geste. Les chevrons utilisent le même chemin.
 */
export function useMonthPager(month: MonthKey, onChange: (m: MonthKey) => void, area: RefObject<HTMLElement | null>) {
  const x = useMotionValue(0)
  const opacity = useMotionValue(1)
  const reduced = useReducedMotion()
  const animation = useRef<AnimationPlaybackControls | null>(null)
  const width = () => area.current?.offsetWidth || 360

  const stop = () => animation.current?.stop()

  const go = (delta: 1 | -1, velocity = 0) => {
    stop()
    const next = addMonths(month, delta)
    if (reduced) {
      // Mouvement réduit : fondu enchaîné au lieu d'un glissement.
      x.set(0)
      animation.current = animate(opacity, 0, {
        ...REDUCED_FADE,
        duration: 0.12,
        onComplete: () => {
          onChange(next)
          animation.current = animate(opacity, 1, { ...REDUCED_FADE, duration: 0.15 })
        },
      })
      return
    }
    const w = width()
    animation.current = animate(x, -delta * w, {
      ...SPRINGS.move(velocity),
      restDelta: 2,
      onComplete: () => {
        onChange(next)
        x.set(delta * w)
        animation.current = animate(x, 0, SPRINGS.default())
      },
    })
  }

  const drag = useHorizontalDrag({
    x,
    onGrab: stop,
    onRelease: (velocity) => {
      const w = width()
      const projected = x.get() + project(velocity)
      if (projected < -w / 2) go(1, velocity)
      else if (projected > w / 2) go(-1, velocity)
      else animation.current = animate(x, 0, Math.abs(velocity) > 100 ? SPRINGS.flick(velocity) : SPRINGS.default())
    },
  })

  return { x, opacity, go, drag }
}
