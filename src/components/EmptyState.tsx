import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  text: string
  action?: { label: string; onClick: () => void }
}

/** État vide : ce qui manque, pourquoi c'est utile, et le geste pour commencer. */
export function EmptyState({ icon: Icon, title, text, action }: Props) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden="true">
        <Icon size={26} />
      </span>
      <p className="empty-title">{title}</p>
      <p className="empty-text-body">{text}</p>
      {action && (
        <button type="button" className="btn btn-primary empty-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
