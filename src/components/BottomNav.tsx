import { House, ListOrdered, Plus, Repeat, Settings2, type LucideIcon } from 'lucide-react'

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
 * L'onglet actif devient une pastille claire avec son libellé ; les autres n'affichent que leur icône
 * (le libellé reste lu par les lecteurs d'écran). Changer d'onglet est l'action la plus fréquente de
 * l'app : aucun mouvement, la pastille change de place à l'instant.
 */
export function BottomNav({ current, onChange, onAdd }: Props) {
  const tab = ({ id, label, icon: Icon }: (typeof ITEMS)[number]) => {
    const active = current === id
    return (
      <button
        key={id}
        type="button"
        className={`tab${active ? ' active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => onChange(id)}
      >
        <Icon size={22} strokeWidth={active ? 2.3 : 2} aria-hidden="true" />
        <span className="tab-label">{label}</span>
      </button>
    )
  }

  return (
    <nav className="tab-bar" aria-label="Navigation principale">
      <div className="tab-pill">
        {ITEMS.slice(0, 2).map(tab)}
        <button type="button" className="tab-add" onClick={onAdd} aria-label="Ajouter une transaction">
          <Plus size={24} strokeWidth={2.4} aria-hidden="true" />
        </button>
        {ITEMS.slice(2).map(tab)}
      </div>
    </nav>
  )
}
