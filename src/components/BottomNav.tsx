import { House, ListOrdered, Plus, Repeat, Settings2, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
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

/** Le fondu de bord n'apparaît que lorsque du contenu passe réellement sous la barre. */
function useScrollEdge() {
  const nav = useRef<HTMLElement>(null)
  useEffect(() => {
    const update = () => {
      const below = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight)
      if (nav.current) nav.current.dataset.edge = below > 1 ? 'on' : 'off'
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
  }, [])
  return nav
}

export function BottomNav({ current, onChange, onAdd }: Props) {
  const nav = useScrollEdge()

  return (
    <nav ref={nav} className="tab-dock" aria-label="Navigation principale">
      <Glass className="tab-bar" height="var(--dock-height)" radius={30} frost={0.6}>
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = current === id
          return (
            <button
              key={id}
              type="button"
              className={`tab${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => onChange(id)}
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
