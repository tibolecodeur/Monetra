import { House, ListOrdered, Plus, Repeat, Settings2, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useContext, useEffect, useRef, useState } from 'react'
import { LENS } from '../lib/glass/presets'
import { SceneContext, useGlassScene, useLens, useLensIntensity, useScroller } from '../lib/glass/react'
import { useSelectionLens } from '../lib/useSelectionLens'
import { Glass } from './Glass'

export type Screen = 'accueil' | 'operations' | 'recurrents' | 'reglages'

const ITEMS: { id: Screen; label: string; icon: LucideIcon }[] = [
  { id: 'accueil', label: 'Accueil', icon: House },
  { id: 'operations', label: 'Opérations', icon: ListOrdered },
  { id: 'recurrents', label: 'Récurrents', icon: Repeat },
  { id: 'reglages', label: 'Réglages', icon: Settings2 },
]

interface Props {
  current: Screen
  onChange: (s: Screen) => void
  onAdd: () => void
}

/** Seuils de tabBarMinimizeBehavior(.onScrollDown) : on réduit en descendant, on rouvre en remontant. */
const MINIMIZE_AFTER = 120
const MINIMIZE_DELTA = 24
const EXPAND_DELTA = 12

/**
 * - Fondu de bord seulement lorsque du contenu passe réellement sous la barre ;
 * - tab bar réduite au défilement vers le bas, rouverte en remontant ou en touchant l'onglet.
 */
function useDockScroll(current: Screen) {
  const scroller = useScroller()
  const nav = useRef<HTMLElement>(null)
  const [minimized, setMinimized] = useState(false)
  const state = useRef({ minimized: false, anchor: 0 })
  useEffect(() => {
    const el = scroller?.current
    if (!el) return
    const apply = (value: boolean) => {
      state.current.minimized = value
      state.current.anchor = el.scrollTop
      setMinimized(value)
    }
    const update = () => {
      const y = el.scrollTop
      const below = el.scrollHeight - (y + el.clientHeight)
      if (nav.current) nav.current.dataset.edge = below > 1 ? 'on' : 'off'
      const s = state.current
      if (y < MINIMIZE_AFTER) {
        if (s.minimized) apply(false)
        s.anchor = y
      } else if (s.minimized) {
        // Réduite : on attend une remontée franche depuis le point le plus bas.
        if (y > s.anchor) s.anchor = y
        else if (s.anchor - y > EXPAND_DELTA) apply(false)
      } else if (y < s.anchor) s.anchor = y
      else if (y - s.anchor > MINIMIZE_DELTA) apply(true)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    observer.observe(el.firstElementChild ?? el)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [scroller, current])
  const expand = () => {
    state.current.minimized = false
    state.current.anchor = scroller?.current?.scrollTop ?? 0
    setMinimized(false)
  }
  return { nav, minimized, expand }
}

/**
 * Onglets dans leur propre petite scène de verre : la bulle de l'onglet actif est une lentille
 * qui grossit et courbe les icônes et libellés qu'elle traverse. On peut la faire glisser.
 */
function TabItems({ current, minimized, onChange, onExpand }: Props & { minimized: boolean; onExpand: () => void }) {
  const items = useRef<HTMLDivElement>(null)
  // Zone filtrée un peu plus grande que les onglets : la bulle soulevée déborde du rail.
  const glass = useRef<HTMLDivElement>(null)
  const defs = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const live = Boolean(useContext(SceneContext))
  const scene = useGlassScene(glass, defs, { enabled: live, overflow: 14 })
  const bubbleLive = useLens(bubble, LENS.selection, scene)
  const visible = minimized ? ITEMS.filter((i) => i.id === current) : ITEMS
  const index = Math.max(0, visible.findIndex((i) => i.id === current))
  const lens = useSelectionLens({
    count: visible.length,
    index,
    onSelect: (i) => onChange(visible[i].id),
    track: items,
  })
  useLensIntensity(scene, bubble, lens.intensity, LENS.selection.refraction)

  return (
    <div className="tab-rail" {...lens.bind}>
      <motion.div
        ref={bubble}
        className="tab-bubble"
        aria-hidden="true"
        data-glass={bubbleLive ? 'live' : 'material'}
        data-lifted={lens.lifted ? '' : undefined}
        style={{ x: lens.x, width: lens.width || undefined, scaleX: lens.scaleX, scaleY: lens.scaleY }}
      />
      <div ref={glass} className="lens-surface">
      <div ref={items} className="tab-items">
        {visible.map(({ id, label, icon: Icon }, i) => {
          const active = current === id
          const hover = lens.hover === i
          return (
            <button
              key={id}
              type="button"
              className={`tab${active ? ' active' : ''}${hover ? ' hover' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              // Réduite, la barre ne montre que l'onglet courant : le toucher la rouvre.
              onClick={() => (minimized ? onExpand() : onChange(id))}
              aria-expanded={active && minimized ? false : undefined}
            >
              <Icon size={24} strokeWidth={active ? 2.3 : 2} aria-hidden="true" />
              <span className="tab-label">{label}</span>
            </button>
          )
        })}
      </div>
      </div>
      <div ref={defs} className="lg-defs" />
    </div>
  )
}

export function BottomNav({ current, onChange, onAdd }: Props) {
  const { nav, minimized, expand } = useDockScroll(current)

  return (
    // GlassEffectContainer : la tab bar et le bouton + forment un groupe, la lumière du toucher passe de l'un à l'autre.
    <nav
      ref={nav}
      className="tab-dock glass-container"
      aria-label="Navigation principale"
      data-minimized={minimized ? 'true' : undefined}
    >
      <Glass className="tab-bar" lens={{ ...LENS.chrome, z: 1 }}>
        <TabItems current={current} minimized={minimized} onChange={onChange} onAdd={onAdd} onExpand={expand} />
      </Glass>
      <Glass className="tab-add-glass glass-press" lens={{ ...LENS.chrome, z: 1 }}>
        <button type="button" className="tab-add" onClick={onAdd} aria-label="Ajouter une transaction">
          <Plus size={28} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </Glass>
    </nav>
  )
}
