import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({ title, onClose, children }: Props) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (e.key !== 'Tab' || !panel.current) return
      // Garde le focus clavier dans la feuille.
      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
      )
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    // Le premier champ autoFocus prend le focus ; sinon on le place sur le panneau.
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        ref={panel}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer">
            <X size={22} aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
