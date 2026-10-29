import { db } from './db'
import { round2 } from './format'
import { uid } from './uid'
import type { Account, Recurring, Transaction } from './types'

function signed(t: Pick<Transaction, 'montant' | 'type'>): number {
  return t.type === 'revenu' ? t.montant : -t.montant
}

async function adjustBalance(compteId: string, delta: number) {
  if (delta === 0) return
  await db.accounts
    .where('id')
    .equals(compteId)
    .modify((a) => {
      a.solde = round2(a.solde + delta)
    })
}

export async function addTransaction(input: Omit<Transaction, 'id'>): Promise<string> {
  const t: Transaction = { ...input, id: uid() }
  await db.transaction('rw', db.transactions, db.accounts, async () => {
    await db.transactions.add(t)
    await adjustBalance(t.compteId, signed(t))
  })
  return t.id
}

/** Réinsère une transaction supprimée (annulation), avec son identifiant d'origine. */
export async function restoreTransaction(t: Transaction) {
  await db.transaction('rw', db.transactions, db.accounts, async () => {
    if (await db.transactions.get(t.id)) return
    await db.transactions.add(t)
    await adjustBalance(t.compteId, signed(t))
  })
}

export async function updateTransaction(id: string, changes: Omit<Transaction, 'id'>) {
  await db.transaction('rw', db.transactions, db.accounts, async () => {
    const previous = await db.transactions.get(id)
    if (!previous) return
    const next: Transaction = { ...previous, ...changes, id }
    await db.transactions.put(next)
    await adjustBalance(previous.compteId, -signed(previous))
    await adjustBalance(next.compteId, signed(next))
  })
}

export async function deleteTransaction(id: string) {
  await db.transaction('rw', db.transactions, db.accounts, async () => {
    const previous = await db.transactions.get(id)
    if (!previous) return
    await db.transactions.delete(id)
    await adjustBalance(previous.compteId, -signed(previous))
  })
}

export async function saveAccount(account: Omit<Account, 'id'> & { id?: string }): Promise<string> {
  const id = account.id ?? uid()
  await db.accounts.put({ ...account, id, solde: round2(account.solde) })
  return id
}

/** Refuse la suppression d'un compte encore utilisé. */
export async function deleteAccount(id: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const [txCount, recCount] = await Promise.all([
    db.transactions.where('compteId').equals(id).count(),
    db.recurring.where('compteId').equals(id).count(),
  ])
  if (txCount > 0 || recCount > 0) {
    return {
      ok: false,
      reason: `Ce compte est utilisé par ${txCount} transaction(s) et ${recCount} récurrent(s).`,
    }
  }
  await db.accounts.delete(id)
  return { ok: true }
}

export async function saveRecurring(rec: Omit<Recurring, 'id'> & { id?: string }): Promise<string> {
  const id = rec.id ?? uid()
  await db.recurring.put({ ...rec, id })
  return id
}

/** Les transactions déjà générées sont conservées. */
export async function deleteRecurring(id: string) {
  await db.recurring.delete(id)
}
