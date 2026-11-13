import { collectData, restoreBackup, toBackup } from './backup'
import { needsDailySnapshot, snapshotsToPrune } from './backupSchedule'
import { db } from './db'
import { uid } from './uid'
import type { Snapshot } from './types'

/**
 * Demande au navigateur de ne pas effacer les données de lui-même quand l'espace manque.
 * Renvoie l'état obtenu (null : non pris en charge). Sans effet sur la suppression de l'app.
 */
export async function requestPersistence(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return null
  }
}

export async function isPersisted(): Promise<boolean | null> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null
  } catch {
    return null
  }
}

/** Prend une copie de sécurité des données actuelles (rien s'il n'y a encore aucune donnée). */
export async function takeSnapshot(reason: Snapshot['reason'], now = new Date()): Promise<Snapshot | null> {
  const data = await collectData()
  if (data.accounts.length === 0 && data.transactions.length === 0 && data.recurring.length === 0) return null
  const snapshot: Snapshot = { id: uid(), createdAt: now.toISOString(), reason, data }
  await db.transaction('rw', db.snapshots, async () => {
    await db.snapshots.add(snapshot)
    const all = await db.snapshots.toArray()
    await db.snapshots.bulkDelete(snapshotsToPrune(all))
  })
  return snapshot
}

let dailyRunning: Promise<void> | null = null

/** Copie automatique du jour, prise à la première ouverture de la journée. */
export function takeDailySnapshot(now = new Date()): Promise<void> {
  dailyRunning ??= (async () => {
    const all = await db.snapshots.toArray()
    if (needsDailySnapshot(all, now)) await takeSnapshot('auto', now)
  })().finally(() => {
    dailyRunning = null
  })
  return dailyRunning
}

/** Restaure une copie, après avoir copié l'état actuel : une restauration se défait aussi. */
export async function restoreSnapshot(id: string) {
  const snapshot = await db.snapshots.get(id)
  if (!snapshot) throw new Error('Cette copie n’existe plus.')
  await takeSnapshot('restore')
  await restoreBackup(toBackup(snapshot.data, new Date(snapshot.createdAt)))
}
