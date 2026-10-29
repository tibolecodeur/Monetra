import { useMemo, useState } from 'react'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { Segmented } from '../components/Segmented'
import { TransactionRow } from '../components/TransactionRow'
import { formatDay, type MonthKey } from '../lib/dates'
import { formatMoney, round2 } from '../lib/format'
import { accountLabels, useAccounts, useMonthTransactions } from '../lib/hooks'
import type { Transaction, TransactionType } from '../lib/types'

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
  const accountNames = useMemo(() => accountLabels(accounts, transactions), [accounts, transactions])

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of transactions ?? []) {
      if (filter !== 'tout' && t.type !== filter) continue
      const list = map.get(t.date) ?? []
      list.push(t)
      map.set(t.date, list)
    }
    return [...map]
  }, [transactions, filter])

  if (!transactions) return null

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Opérations</h1>
        <MonthSwitcher month={month} onChange={onMonthChange} />
      </header>

      <Segmented
        label="Filtrer"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'tout', label: 'Tout' },
          { value: 'depense', label: 'Dépenses' },
          { value: 'revenu', label: 'Revenus' },
        ]}
      />

      {groups.length === 0 ? (
        <p className="muted center">Aucune opération pour ce mois.</p>
      ) : (
        groups.map(([date, list]) => {
          const net = round2(list.reduce((s, t) => s + (t.type === 'revenu' ? t.montant : -t.montant), 0))
          return (
            <section key={date} className="day-group">
              <h2 className="day-title">
                <span>{formatDay(date)}</span>
                <span className="muted">
                  {net > 0 ? '+' : net < 0 ? '−' : ''}
                  {formatMoney(Math.abs(net))}
                </span>
              </h2>
              <ul className="tx-list card">
                {list.map((t) => (
                  <TransactionRow key={t.id} transaction={t} accountName={accountNames.get(t.compteId)} onSelect={onSelect} />
                ))}
              </ul>
            </section>
          )
        })
      )}
      {groups.length > 0 && <p className="footnote">Touchez une opération pour la modifier ou la supprimer.</p>}
    </div>
  )
}
