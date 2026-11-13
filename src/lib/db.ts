import Dexie, { type EntityTable } from 'dexie'
import type { Account, Budget, Goal, Recurring, Snapshot, Transaction } from './types'

export const db = new Dexie('monetra') as Dexie & {
  accounts: EntityTable<Account, 'id'>
  transactions: EntityTable<Transaction, 'id'>
  recurring: EntityTable<Recurring, 'id'>
  budgets: EntityTable<Budget, 'categorie'>
  goals: EntityTable<Goal, 'id'>
  snapshots: EntityTable<Snapshot, 'id'>
}

db.version(1).stores({
  accounts: 'id',
  transactions: 'id, date, compteId, recurringId',
  recurring: 'id, compteId',
  budgets: 'categorie',
  goals: 'id',
})

// Version 2 : copies de sécurité locales. Ajouter une table ne touche pas aux données existantes.
db.version(2).stores({
  snapshots: 'id, createdAt',
})
