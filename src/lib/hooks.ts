import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { monthBounds, type MonthKey } from './dates'
import type { Account, Recurring, Transaction } from './types'

export function useAccounts(): Account[] | undefined {
  return useLiveQuery(() => db.accounts.toArray().then((list) => list.sort((a, b) => a.nom.localeCompare(b.nom))))
}

export function useRecurring(): Recurring[] | undefined {
  return useLiveQuery(() => db.recurring.toArray())
}

/** Transactions du mois, de la plus récente à la plus ancienne. */
export function useMonthTransactions(month: MonthKey): Transaction[] | undefined {
  return useLiveQuery(() => {
    const [start, end] = monthBounds(month)
    return db.transactions.where('date').between(start, end, true, true).reverse().sortBy('date')
  }, [month])
}

/** Noms des comptes, uniquement si plusieurs comptes apparaissent dans `items`. */
export function accountLabels(accounts: Account[] | undefined, items: { compteId: string }[] | undefined) {
  const used = new Set(items?.map((i) => i.compteId))
  const names = new Map<string, string>()
  if (used.size > 1) for (const a of accounts ?? []) names.set(a.id, a.nom)
  return names
}
