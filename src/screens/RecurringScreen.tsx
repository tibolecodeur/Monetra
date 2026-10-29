import { Plus } from 'lucide-react'
import { getCategory } from '../lib/categories'
import { formatShortDate, today } from '../lib/dates'
import { formatMoney, round2 } from '../lib/format'
import { accountLabels, useAccounts, useRecurring } from '../lib/hooks'
import type { Recurring } from '../lib/types'

interface Props {
  onAdd: () => void
  onSelect: (r: Recurring) => void
}

export function RecurringScreen({ onAdd, onSelect }: Props) {
  const recurring = useRecurring()
  const accounts = useAccounts()
  if (!recurring || !accounts) return <div className="screen" aria-busy="true" />

  const now = today()
  const accountNames = accountLabels(accounts, recurring)
  const sorted = [...recurring].sort((a, b) => a.jourDuMois - b.jourDuMois || a.libelle.localeCompare(b.libelle))
  const active = sorted.filter((r) => !r.dateFin || r.dateFin >= now)
  const ended = sorted.filter((r) => r.dateFin && r.dateFin < now)
  const sum = (type: Recurring['type']) =>
    round2(active.filter((r) => r.type === type).reduce((s, r) => s + r.montant, 0))

  const renderList = (list: Recurring[]) => (
    <ul className="list card card-flush">
      {list.map((r) => {
        const meta = [
          getCategory(r.categorie).label,
          accountNames.get(r.compteId),
          r.dateFin ? `jusqu'au ${formatShortDate(r.dateFin)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
        return (
          <li key={r.id}>
            <button type="button" className="row" onClick={() => onSelect(r)}>
              <span className={`day-badge ${r.type}`}>
                <small aria-hidden="true">le</small>
                <span aria-hidden="true">{r.jourDuMois}</span>
                <span className="sr-only">Le {r.jourDuMois} du mois :</span>
              </span>
              <span className="row-main">
                <span className="row-title">{r.libelle}</span>
                {meta && <span className="row-meta">{meta}</span>}
              </span>
              <span className={`amount ${r.type}`}>
                {r.type === 'revenu' ? '+' : '−'}
                {formatMoney(r.montant)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="screen">
      <header className="screen-header">
        <h1 tabIndex={-1}>Récurrents</h1>
      </header>

      <section className="totals" aria-label="Total mensuel des récurrents actifs">
        <div>
          <span className="totals-label">Revenus fixes / mois</span>
          <span className="amount revenu">+{formatMoney(sum('revenu'))}</span>
        </div>
        <div>
          <span className="totals-label">Charges fixes / mois</span>
          <span className="amount">−{formatMoney(sum('depense'))}</span>
        </div>
      </section>

      {active.length === 0 ? (
        <div className="card empty-state">
          <p>
            Loyer, forfait, salaire d'alternance… Ajoutez ce qui revient chaque mois : Monetra crée la transaction
            automatiquement au bon jour.
          </p>
        </div>
      ) : (
        renderList(active)
      )}

      <button type="button" className="btn btn-secondary btn-block sticky-action" onClick={onAdd}>
        <Plus size={20} aria-hidden="true" />
        Nouveau récurrent
      </button>

      {ended.length > 0 && (
        <>
          <h2 className="section-title">Terminés</h2>
          {renderList(ended)}
        </>
      )}
    </div>
  )
}
