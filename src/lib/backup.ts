import { db } from './db'
import { today } from './dates'
import type { Account, Budget, Goal, Recurring, Transaction } from './types'

export const BACKUP_VERSION = 1

export interface BackupData {
  accounts: Account[]
  transactions: Transaction[]
  recurring: Recurring[]
  budgets: Budget[]
  goals: Goal[]
}

export interface Backup {
  app: 'monetra'
  version: number
  exportedAt: string
  data: BackupData
}

export async function createBackup(): Promise<Backup> {
  const [accounts, transactions, recurring, budgets, goals] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.recurring.toArray(),
    db.budgets.toArray(),
    db.goals.toArray(),
  ])
  return {
    app: 'monetra',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { accounts, transactions, recurring, budgets, goals },
  }
}

export async function downloadBackup() {
  const backup = await createBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `monetra-${today()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return backup
}

type Check = (item: Record<string, unknown>) => boolean

const isStr = (v: unknown) => typeof v === 'string'
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const isType = (v: unknown) => v === 'revenu' || v === 'depense'

const CHECKS: Record<keyof BackupData, Check> = {
  accounts: (a) => isStr(a.id) && isStr(a.nom) && isStr(a.type) && isNum(a.solde),
  transactions: (t) =>
    isStr(t.id) && isStr(t.date) && isNum(t.montant) && isType(t.type) && isStr(t.categorie) && isStr(t.compteId),
  recurring: (r) =>
    isStr(r.id) &&
    isStr(r.libelle) &&
    isNum(r.montant) &&
    isType(r.type) &&
    isNum(r.jourDuMois) &&
    isStr(r.compteId) &&
    isStr(r.dateDebut),
  budgets: (b) => isStr(b.categorie) && isNum(b.plafondMensuel),
  goals: (g) => isStr(g.id) && isStr(g.nom) && isNum(g.montantCible),
}

export function parseBackup(text: string): Backup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error("Le fichier n'est pas un JSON valide.")
  }
  const obj = raw as Partial<Backup> | null
  if (!obj || obj.app !== 'monetra' || typeof obj.data !== 'object' || obj.data === null) {
    throw new Error("Ce fichier n'est pas une sauvegarde Monetra.")
  }
  if (typeof obj.version !== 'number' || obj.version > BACKUP_VERSION) {
    throw new Error('Version de sauvegarde non prise en charge.')
  }
  const data = obj.data as unknown as Record<string, unknown>
  for (const key of Object.keys(CHECKS) as (keyof BackupData)[]) {
    const list = data[key] ?? []
    if (!Array.isArray(list)) throw new Error(`Section « ${key} » invalide.`)
    const bad = list.findIndex((item) => typeof item !== 'object' || item === null || !CHECKS[key](item))
    if (bad !== -1) throw new Error(`Élément ${bad + 1} de « ${key} » invalide.`)
    data[key] = list
  }
  return obj as Backup
}

/** Remplace toute la base par le contenu de la sauvegarde. */
export async function restoreBackup(backup: Backup) {
  const { accounts, transactions, recurring, budgets, goals } = backup.data
  await db.transaction('rw', [db.accounts, db.transactions, db.recurring, db.budgets, db.goals], async () => {
    await Promise.all([
      db.accounts.clear(),
      db.transactions.clear(),
      db.recurring.clear(),
      db.budgets.clear(),
      db.goals.clear(),
    ])
    await db.accounts.bulkAdd(accounts)
    await db.transactions.bulkAdd(transactions)
    await db.recurring.bulkAdd(recurring)
    await db.budgets.bulkAdd(budgets)
    await db.goals.bulkAdd(goals)
  })
}
