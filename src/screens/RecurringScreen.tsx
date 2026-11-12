import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Money } from '../components/AnimatedAmount'
import { SwipeRow } from '../components/SwipeRow'
import { getCategory } from '../lib/categories'
import { useContextMenu } from '../lib/contextMenu'
import { useLongPress } from '../lib/useLongPress'
import { formatShortDate, today } from '../lib/dates'
import { formatMoney, round2 } from '../lib/format'
import { accountLabels, useAccounts, useRecurring } from '../lib/hooks'
import { deleteRecurring, restoreRecurring } from '../lib/mutations'
import { useToast } from '../lib/toast'
import type { Recurring } from '../lib/types'
import { NavHeader } from '../components/NavHeader'

interface Props {
  onAdd: () => void
  onSelect: (r: Recurring) => void
}

export function RecurringScreen({ onAdd, onSelect }: Props) {
  const recurring = useRecurring()
  const accounts = useAccounts()
  const toast = useToast()
  if (!recurring || !accounts) return <div className="screen" aria-busy="true" />

  const now = today()
  const accountNames = accountLabels(accounts, recurring)
  const sorted = [...recurring].sort((a, b) => a.jourDuMois - b.jourDuMois || a.libelle.localeCompare(b.libelle))
  const active = sorted.filter((r) => !r.dateFin || r.dateFin >= now)
  const ended = sorted.filter((r) => r.dateFin && r.dateFin < now)
  const sum = (type: Recurring['type']) =>
    round2(active.filter((r) => r.type === type).reduce((s, r) => s + r.montant, 0))

  // Suppression par glissement, annulable ; les transactions déjà générées sont conservées.
  const swipeDelete = (r: Recurring) => {
    void deleteRecurring(r.id)
    toast({ message: `« ${r.libelle} » supprimé`, action: { label: 'Annuler', onAction: () => void restoreRecurring(r) } })
  }

  const renderList = (list: Recurring[]) => (
    <ul className="list">
      <AnimatePresence initial={false}>
      {list.map((r) => {
        const meta = [
          getCategory(r.categorie).label,
          accountNames.get(r.compteId),
          r.dateFin ? `jusqu'au ${formatShortDate(r.dateFin)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
        return (
          <motion.li key={r.id} layout="position" exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.15 } }}>
            <SwipeRow label={`Supprimer ${r.libelle}`} onDelete={() => swipeDelete(r)}>
            <RecurringRow recurring={r} meta={meta} onSelect={onSelect} onDelete={swipeDelete} />
            </SwipeRow>
          </motion.li>
        )
      })}
      </AnimatePresence>
    </ul>
  )

  const net = round2(sum('revenu') - sum('depense'))

  return (
    <div className="screen">
      <NavHeader title="Récurrents" />

      <section className="summary" aria-label="Total mensuel des récurrents actifs">
        <p className="summary-label">Net fixe par mois</p>
        <p className={`summary-value amount${net < 0 ? ' negative' : ''}`}>
          <Money value={Math.abs(net)} sign={net > 0 ? '+' : net < 0 ? '−' : ''} />
        </p>
        <div className="summary-pills">
          <span className="pill">
            <ArrowDownLeft size={16} aria-hidden="true" className="pill-icon revenu" />
            <span className="pill-label">Revenus fixes</span>
            <span className="amount revenu">+{formatMoney(sum('revenu'))}</span>
          </span>
          <span className="pill">
            <ArrowUpRight size={16} aria-hidden="true" className="pill-icon" />
            <span className="pill-label">Charges fixes</span>
            <span className="amount">−{formatMoney(sum('depense'))}</span>
          </span>
        </div>
      </section>

      <div className="ledger">
        <div className="ledger-head">
          <h2 className="ledger-title">Chaque mois</h2>
        </div>
        {active.length === 0 ? (
          <div className="empty-state ledger-empty">
            <p>
              Loyer, forfait, salaire d'alternance… Ajoutez ce qui revient chaque mois : Monetra crée la transaction
              automatiquement au bon jour.
            </p>
          </div>
        ) : (
          renderList(active)
        )}

        {ended.length > 0 && (
          <>
            <h3 className="day-title">Terminés</h3>
            {renderList(ended)}
          </>
        )}
      </div>

      {/* Reste visible juste au-dessus de la barre d'onglets pendant le défilement. */}
      <button type="button" className="btn btn-primary sticky-action" onClick={onAdd}>
        <Plus size={20} aria-hidden="true" />
        Nouveau récurrent
      </button>
    </div>
  )
}

interface RowProps {
  recurring: Recurring
  meta: string
  onSelect: (r: Recurring) => void
  onDelete: (r: Recurring) => void
}

/** Ligne de récurrent : toucher pour modifier, appui long pour le menu contextuel. */
function RecurringRow({ recurring: r, meta, onSelect, onDelete }: RowProps) {
  const openMenu = useContextMenu()
  const longPress = useLongPress<HTMLButtonElement>((anchor) =>
    openMenu({
      anchor,
      label: r.libelle,
      items: [
        { label: 'Modifier', icon: Pencil, onSelect: () => onSelect(r) },
        { label: 'Supprimer', icon: Trash2, onSelect: () => onDelete(r), destructive: true },
      ],
    }),
  )
  return (
    <button type="button" className="row" onClick={() => onSelect(r)} {...longPress}>
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
        <Money value={r.montant} sign={r.type === 'revenu' ? '+' : '−'} />
      </span>
    </button>
  )
}
