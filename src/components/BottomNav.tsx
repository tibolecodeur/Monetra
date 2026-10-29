import type { ReactNode } from 'react'
import { HomeIcon, ListIcon, RepeatIcon, SettingsIcon } from './Icons'

export type Screen = 'accueil' | 'operations' | 'recurrents' | 'reglages'

const ITEMS: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: 'accueil', label: 'Accueil', icon: <HomeIcon /> },
  { id: 'operations', label: 'Opérations', icon: <ListIcon /> },
  { id: 'recurrents', label: 'Récurrents', icon: <RepeatIcon /> },
  { id: 'reglages', label: 'Réglages', icon: <SettingsIcon /> },
]

interface Props {
  current: Screen
  onChange: (s: Screen) => void
}

export function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={current === item.id ? 'active' : undefined}
          aria-current={current === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
