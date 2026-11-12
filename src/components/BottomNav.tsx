import { House, ListOrdered, Plus, Repeat, Settings2, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { SPRINGS } from '../lib/motion'

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

/**
 * Barre d'onglets flottante en capsule, bouton d'ajout au centre.
 * L'onglet actif porte une pastille claire avec son libellé ; les autres n'affichent que leur icône
 * (le libellé reste lu par les lecteurs d'écran).
 * La pastille glisse d'un onglet à l'autre (`layoutId`, spring critique et court) ; les onglets, dont la
 * largeur change avec le libellé, glissent avec elle (`layout="position"`). La teinte du texte change à
 * l'instant. En mouvement réduit, MotionConfig coupe ces animations : la pastille change de place d'un coup.
 */
export function BottomNav({ current, onChange, onAdd }: Props) {
  const tab = ({ id, label, icon: Icon }: (typeof ITEMS)[number]) => {
    const active = current === id
    return (
      <motion.button
        key={id}
        type="button"
        className={`tab${active ? ' active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => onChange(id)}
        layout="position"
        transition={SPRINGS.tab()}
      >
        {active && (
          <motion.span
            className="tab-indicator"
            layoutId="tab-indicator"
            transition={SPRINGS.tab()}
            // Rayon posé en style : Motion le corrige pendant que la pastille change de largeur.
            style={{ borderRadius: 999 }}
            aria-hidden="true"
          />
        )}
        <Icon size={22} strokeWidth={active ? 2.3 : 2} aria-hidden="true" />
        <span className="tab-label">{label}</span>
      </motion.button>
    )
  }

  return (
    <nav className="tab-bar" aria-label="Navigation principale">
      <div className="tab-pill">
        {ITEMS.slice(0, 2).map(tab)}
        {/* Le conteneur glisse ; le bouton garde son retour à l'appui en CSS (Motion écrirait son transform). */}
        <motion.span className="tab-add-slot" layout="position" transition={SPRINGS.tab()}>
          <button type="button" className="tab-add" onClick={onAdd} aria-label="Ajouter une transaction">
            <Plus size={24} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </motion.span>
        {ITEMS.slice(2).map(tab)}
      </div>
    </nav>
  )
}
