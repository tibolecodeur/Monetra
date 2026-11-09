import { House, ListOrdered, Plus, Repeat, Settings2, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SPRINGS } from '../lib/motion'
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
function useDockScroll() {
  const nav = useRef<HTMLElement>(null)
  const [minimized, setMinimized] = useState(false)
  const state = useRef({ minimized: false, anchor: 0 })
  const apply = useCallback((value: boolean) => {
    state.current.minimized = value
    state.current.anchor = window.scrollY
    setMinimized(value)
  }, [])
  useEffect(() => {
    const update = () => {
      const y = window.scrollY
      const below = document.documentElement.scrollHeight - (y + window.innerHeight)
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
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [apply])
  return { nav, minimized, expand: () => apply(false) }
}

export function BottomNav({ current, onChange, onAdd }: Props) {
  const { nav, minimized, expand } = useDockScroll()

  return (
    // GlassEffectContainer : la tab bar et le bouton + forment un groupe, la lumière du toucher passe de l'un à l'autre.
    <nav
      ref={nav}
      className="tab-dock glass-container"
      aria-label="Navigation principale"
      data-minimized={minimized ? 'true' : undefined}
    >
      <Glass className="tab-bar" width="var(--tab-bar-width)" height="var(--dock-height)" radius={30} frost={0.6}>
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = current === id
          return (
            <button
              key={id}
              type="button"
              className={`tab${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              // Réduite, la barre ne montre que l'onglet courant : le toucher la rouvre.
              onClick={() => (minimized ? expand() : onChange(id))}
              aria-expanded={active && minimized ? false : undefined}
            >
              {/* Lentille de verre qui glisse en spring d'un onglet à l'autre. */}
              {active && <motion.span layoutId="tab-lens" className="tab-lens" transition={SPRINGS.default()} />}
              <Icon size={24} strokeWidth={active ? 2.3 : 2} aria-hidden="true" />
              <span className="tab-label">{label}</span>
            </button>
          )
        })}
      </Glass>
      <Glass
        className="tab-add-glass glass-press"
        width="var(--dock-add)"
        height="var(--dock-add)"
        radius={28}
        frost={0.72}
        tint="var(--color-accent)"
      >
        <button type="button" className="tab-add" onClick={onAdd} aria-label="Ajouter une transaction">
          <Plus size={28} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </Glass>
    </nav>
  )
}
