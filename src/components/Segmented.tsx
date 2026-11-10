import { motion } from 'motion/react'
import { useContext, useRef } from 'react'
import { LENS } from '../lib/glass/presets'
import { SceneContext, useGlassLive, useGlassScene, useLens, useLensIntensity } from '../lib/glass/react'
import { useSelectionLens } from '../lib/useSelectionLens'
import { Glass } from './Glass'

interface Props<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}

/**
 * Contrôle segmenté : rail en verre ; le curseur est une lentille (dans sa propre petite scène)
 * qui glisse en spring, grossit les libellés qu'elle traverse et se fait glisser au doigt.
 * Fonctionne aussi dans une feuille, où le rail est un matériau (pas de scène derrière).
 */
export function Segmented<T extends string>({ value, options, onChange, label }: Props<T>) {
  const labels = useRef<HTMLDivElement>(null)
  const glass = useRef<HTMLDivElement>(null)
  const defs = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)
  const inScene = Boolean(useContext(SceneContext))
  const live = useGlassLive()
  const scene = useGlassScene(glass, defs, { enabled: live, overflow: 10 })
  const thumbLive = useLens(thumb, LENS.selection, scene)
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const lens = useSelectionLens({ count: options.length, index, onSelect: (i) => onChange(options[i].value), track: labels })
  useLensIntensity(scene, thumb, lens.intensity, LENS.selection.refraction)

  return (
    <Glass className={`segmented${inScene ? '' : ' segmented--sheet'}`} lens={LENS.control}>
      <div className="segmented-rail" {...lens.bind}>
        <motion.div
          ref={thumb}
          className="segment-thumb"
          aria-hidden="true"
          data-glass={thumbLive ? 'live' : 'material'}
          data-lifted={lens.lifted ? '' : undefined}
          style={{ x: lens.x, width: lens.width || undefined, scaleX: lens.scaleX, scaleY: lens.scaleY }}
        />
        <div ref={glass} className="lens-surface">
        <div ref={labels} className="segmented-inner" role="radiogroup" aria-label={label}>
          {options.map((o, i) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={value === o.value}
              className={`${value === o.value ? 'active' : ''}${lens.hover === i ? ' hover' : ''}`}
              onClick={() => onChange(o.value)}
            >
              <span className="segment-label">{o.label}</span>
            </button>
          ))}
        </div>
        </div>
        <div ref={defs} className="lg-defs" />
      </div>
    </Glass>
  )
}
