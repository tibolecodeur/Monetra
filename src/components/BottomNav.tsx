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

export function BottomNav({ current, onChange, onAdd }: Props) {
  const renderItem = ({ id, label, icon: Icon }: (typeof ITEMS)[number]) => (
    <button
      key={id}
      type="button"
      className={`tab${current === id ? ' active' : ''}`}
      aria-current={current === id ? 'page' : undefined}
      onClick={() => onChange(id)}
    >
      <Icon size={24} strokeWidth={current === id ? 2.4 : 2} aria-hidden="true" />
      <span>{label}</span>
    </button>
  )

  return (
    <nav className="tab-bar" aria-label="Navigation principale">
      {ITEMS.slice(0, 2).map(renderItem)}
      <div className="tab-add-slot">
        <button type="button" className="tab-add" onClick={onAdd} aria-label="Ajouter une transaction">
          <Plus size={28} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
      {ITEMS.slice(2).map(renderItem)}
    </nav>
  )
}
