import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { Segmented } from '../components/Segmented'
import { TransactionRow } from '../components/TransactionRow'
import { formatDay, type MonthKey } from '../lib/dates'
import { formatMoney, round2 } from '../lib/format'
import { accountLabels, useAccounts, useMonthTransactions } from '../lib/hooks'
import { deleteTransaction, restoreTransaction } from '../lib/mutations'
import { useToast } from '../lib/toast'
import type { Transaction, TransactionType } from '../lib/types'
import { NavHeader } from '../components/NavHeader'

interface Props {
  month: MonthKey
  onMonthChange: (m: MonthKey) => void
  onSelect: (t: Transaction) => void
}

type Filter = 'tout' | TransactionType

export function Transactions({ month, onMonthChange, onSelect }: Props) {
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

  return (
    <div className="screen">
      <NavHeader title="Opérations" />
      <MonthSwitcher month={month} onChange={onMonthChange} />

      <section className="totals" aria-label="Totaux du mois">
        <div>
          <span className="totals-label">Entrées</span>
          <span className="amount revenu">+{formatMoney(entrees)}</span>
        </div>
        <div>
          <span className="totals-label">Sorties</span>
          <span className="amount">−{formatMoney(sorties)}</span>
        </div>
      </section>

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

      {groups.length === 0 ? (
        <div className="card empty-state">
          <p>Aucune opération pour ce mois.</p>
          <p className="hint">Touchez le bouton + en bas de l'écran pour en saisir une.</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {groups.map(([date, list]) => {
          const net = round2(list.reduce((s, t) => s + (t.type === 'revenu' ? t.montant : -t.montant), 0))
          return (
            <motion.section
              key={date}
              className="day-group"
              aria-label={formatDay(date)}
              layout="position"
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.15 } }}
            >
              <h2 className="day-title">
                <span>{formatDay(date)}</span>
                <span className="amount">
                  {net > 0 ? '+' : net < 0 ? '−' : ''}
                  {formatMoney(Math.abs(net))}
                </span>
              </h2>
              <ul className="list card card-flush">
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
      {groups.length > 0 && <p className="footnote">Touchez une opération pour la modifier. Glissez-la vers la gauche pour la supprimer.</p>}
    </div>
  )
}
