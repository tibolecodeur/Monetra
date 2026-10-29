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
  if (!recurring || !accounts) return null

  const now = today()
  const accountNames = accountLabels(accounts, recurring)
  const sorted = [...recurring].sort((a, b) => a.jourDuMois - b.jourDuMois || a.libelle.localeCompare(b.libelle))
  const active = sorted.filter((r) => !r.dateFin || r.dateFin >= now)
  const ended = sorted.filter((r) => r.dateFin && r.dateFin < now)
  const sum = (type: Recurring['type']) => round2(active.filter((r) => r.type === type).reduce((s, r) => s + r.montant, 0))

  const renderList = (list: Recurring[]) => (
    <ul className="tx-list card">
      {list.map((r) => {
        const cat = getCategory(r.categorie)
        const meta = [
          `le ${r.jourDuMois}`,
          r.type === 'depense' ? cat.label : null,
          accountNames.get(r.compteId),
          r.dateFin ? `jusqu'au ${formatShortDate(r.dateFin)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
        return (
          <li key={r.id}>
            <button type="button" className="tx-row" onClick={() => onSelect(r)}>
              <span className={`tx-icon ${r.type}`} aria-hidden="true">
                {cat.emoji}
              </span>
              <span className="tx-main">
                <span className="tx-title">{r.libelle}</span>
                <span className="tx-meta">{meta}</span>
              </span>
              <span className={`tx-amount ${r.type}`}>
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
        <h1>Récurrents</h1>
        <button type="button" className="button primary small" onClick={onAdd}>
          + Ajouter
        </button>
      </header>

      <section className="stats two" aria-label="Total mensuel">
        <div className="stat">
          <span className="stat-label">Revenus fixes / mois</span>
          <span className="stat-value income">{formatMoney(sum('revenu'))}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Charges fixes / mois</span>
          <span className="stat-value">{formatMoney(sum('depense'))}</span>
        </div>
      </section>

      {active.length === 0 ? (
        <div className="card empty-state">
          <p>Loyer, forfait, salaire d'alternance… Ajoutez ce qui revient chaque mois : Monetra crée la transaction automatiquement.</p>
        </div>
      ) : (
        renderList(active)
      )}

      {ended.length > 0 && (
        <>
          <h2 className="section-title">Terminés</h2>
          {renderList(ended)}
        </>
      )}
    </div>
  )
}
