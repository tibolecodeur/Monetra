import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Money } from '../components/AnimatedAmount'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { Segmented } from '../components/Segmented'
import { TransactionRow } from '../components/TransactionRow'
import { formatDayHeading, type MonthKey } from '../lib/dates'
import { formatMoney, formatSigned, round2 } from '../lib/format'
import { accountLabels, useAccounts, useMonthTransactions } from '../lib/hooks'
import { deleteTransaction, restoreTransaction } from '../lib/mutations'
import { useToast } from '../lib/toast'
import type { Transaction, TransactionType } from '../lib/types'
import { NavHeader } from '../components/NavHeader'

interface Props {
  month: MonthKey
  onMonthChange: (m: MonthKey) => void
  onSelect: (t: Transaction) => void
  onAdd?: () => void
}

type Filter = 'tout' | TransactionType

export function Transactions({ month, onMonthChange, onSelect, onAdd }: Props) {
  const accounts = useAccounts()
  const transactions = useMonthTransactions(month)
  const [filter, setFilter] = useState<Filter>('tout')
  const toast = useToast()

  // Suppression par glissement : pas de dialogue, une annulation possible depuis le toast.
  const swipeDelete = (t: Transaction) => {
    void deleteTransaction(t.id)
    toast({ message: 'Transaction supprimée', action: { label: 'Annuler', onAction: () => void restoreTransaction(t) } })
  }
  const accountNames = useMemo(() => accountLabels(accounts, transactions), [accounts, transactions])

  const { groups, entrees, sorties } = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    let entrees = 0
    let sorties = 0
    for (const t of transactions ?? []) {
      if (t.type === 'revenu') entrees += t.montant
      else sorties += t.montant
      if (filter !== 'tout' && t.type !== filter) continue
      const list = map.get(t.date) ?? []
      list.push(t)
      map.set(t.date, list)
    }
    return { groups: [...map], entrees: round2(entrees), sorties: round2(sorties) }
  }, [transactions, filter])

  if (!transactions) return <div className="screen" aria-busy="true" />

  const net = round2(entrees - sorties)

  return (
    <div className="screen">
      <NavHeader title="Opérations" />

      <section className="summary" aria-label="Totaux du mois">
        <div className="summary-head">
          <p className="summary-label">Solde du mois</p>
          <MonthSwitcher month={month} onChange={onMonthChange} />
        </div>
        <p className={`summary-value amount${net < 0 ? ' negative' : ''}`}>
          <Money value={Math.abs(net)} sign={net > 0 ? '+' : net < 0 ? '−' : ''} />
        </p>
        <div className="summary-pills">
          <span className="pill">
            <ArrowDownLeft size={16} aria-hidden="true" className="pill-icon revenu" />
            <span className="pill-label">Entrées</span>
            <span className="amount revenu">{formatSigned(entrees, '+')}</span>
          </span>
          <span className="pill">
            <ArrowUpRight size={16} aria-hidden="true" className="pill-icon" />
            <span className="pill-label">Sorties</span>
            <span className="amount">{formatSigned(sorties, '−')}</span>
          </span>
        </div>
      </section>

      <div className="ledger">
        <div className="ledger-head">
          <h2 className="sr-only">Liste des opérations</h2>
          <Segmented
            label="Filtrer les opérations"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'tout', label: 'Tout' },
              { value: 'depense', label: 'Dépenses' },
              { value: 'revenu', label: 'Revenus' },
            ]}
          />
        </div>

        {groups.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={filter === 'tout' ? 'Aucune opération ce mois-ci' : `Aucun${filter === 'revenu' ? ' revenu' : 'e dépense'} ce mois-ci`}
            text="Chaque dépense saisie ici met à jour votre reste à vivre."
            action={onAdd ? { label: 'Saisir une opération', onClick: onAdd } : undefined}
          />
        ) : (
          <AnimatePresence initial={false}>
            {groups.map(([date, list]) => {
              const dayNet = round2(list.reduce((s, t) => s + (t.type === 'revenu' ? t.montant : -t.montant), 0))
              return (
                <motion.section
                  key={date}
                  className="day-group"
                  aria-label={formatDayHeading(date)}
                  layout="position"
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.15 } }}
                >
                  <h3 className="day-title">
                    <span>{formatDayHeading(date)}</span>
                    <span className="amount">
                      {dayNet > 0 ? '+' : dayNet < 0 ? '−' : ''}
                      {formatMoney(Math.abs(dayNet))}
                    </span>
                  </h3>
                  <ul className="list">
                    <AnimatePresence initial={false}>
                      {list.map((t) => (
                        <TransactionRow
                          key={t.id}
                          transaction={t}
                          accountName={accountNames.get(t.compteId)}
                          onSelect={onSelect}
                          onSwipeDelete={swipeDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </motion.section>
              )
            })}
          </AnimatePresence>
        )}
      </div>
      {groups.length > 0 && (
        <p className="footnote">Touchez une opération pour la modifier. Glissez-la vers la gauche pour la supprimer.</p>
      )}
    </div>
  )
}
