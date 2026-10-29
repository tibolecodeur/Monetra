import { db } from './db'
import { addMonths, currentMonth, dayInMonth, monthOf, today, type MonthKey } from './dates'
import { round2 } from './format'
import { uid } from './uid'
import type { Recurring, Transaction } from './types'

function isActiveOn(r: Recurring, date: string): boolean {
  return date >= r.dateDebut && (!r.dateFin || date <= r.dateFin)
}

/** Occurrences échues (date <= aujourd'hui) pas encore générées. */
export function dueOccurrences(r: Recurring, now = today()): { month: MonthKey; date: string }[] {
  const start = monthOf(r.dateDebut)
  let month = r.derniereGeneration ? addMonths(r.derniereGeneration, 1) : start
  if (month < start) month = start
  const out: { month: MonthKey; date: string }[] = []
  const last = monthOf(now)
  for (; month <= last; month = addMonths(month, 1)) {
    const date = dayInMonth(month, r.jourDuMois)
    if (date > now) break
    if (r.dateFin && date > r.dateFin) break
    if (isActiveOn(r, date)) out.push({ month, date })
  }
  return out
}

/** Occurrences prévues dans `month` mais pas encore passées. */
export function upcomingOccurrences(recurring: Recurring[], month: MonthKey, now = today()) {
  if (month < currentMonth()) return []
  return recurring
    .map((r) => ({ recurring: r, date: dayInMonth(month, r.jourDuMois) }))
    .filter(
      ({ recurring: r, date }) =>
        date > now && isActiveOn(r, date) && (!r.derniereGeneration || r.derniereGeneration < month),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
}

let running: Promise<number> | null = null

/** Crée les transactions des récurrents échus. Renvoie le nombre créé. */
export function generateRecurring(): Promise<number> {
  running ??= run().finally(() => {
    running = null
  })
  return running
}

async function run(): Promise<number> {
  const now = today()
  let created = 0
  await db.transaction('rw', db.recurring, db.transactions, db.accounts, async () => {
    const all = await db.recurring.toArray()
    for (const r of all) {
      const due = dueOccurrences(r, now)
      if (due.length === 0) continue
      const account = await db.accounts.get(r.compteId)
      let solde = account?.solde ?? 0
      const txs: Transaction[] = due.map(({ date }) => {
        solde += r.type === 'revenu' ? r.montant : -r.montant
        return {
          id: uid(),
          date,
          montant: r.montant,
          type: r.type,
          categorie: r.categorie,
          compteId: r.compteId,
          note: r.libelle,
          recurringId: r.id,
        }
      })
      await db.transactions.bulkAdd(txs)
      if (account) await db.accounts.update(account.id, { solde: round2(solde) })
      await db.recurring.update(r.id, { derniereGeneration: due[due.length - 1].month })
      created += txs.length
    }
  })
  return created
}
