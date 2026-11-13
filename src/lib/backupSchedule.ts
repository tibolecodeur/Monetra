/**
 * Règles de la sauvegarde quotidienne et des copies de sécurité, sans accès au navigateur
 * (fonctions pures, testées dans backupSchedule.test.ts).
 */

/** Date locale YYYY-MM-DD d'un instant. */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Minutes depuis minuit pour « HH:MM » (heure invalide : 21 h). */
function minutesOf(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) return 21 * 60
  return Math.min(23, Number(match[1])) * 60 + Math.min(59, Number(match[2]))
}

/**
 * La sauvegarde du jour est due quand l'heure choisie est passée, qu'aucune sauvegarde n'a été faite
 * aujourd'hui et que l'utilisateur ne l'a pas reportée à demain.
 */
export function isBackupDue(now: Date, time: string, lastBackup: string | null, snoozedDay: string | null): boolean {
  const today = localDay(now)
  if (snoozedDay === today) return false
  if (lastBackup && localDay(new Date(lastBackup)) === today) return false
  return now.getHours() * 60 + now.getMinutes() >= minutesOf(time)
}

/** Jours entiers écoulés depuis la dernière sauvegarde (null : jamais). */
export function daysSince(lastBackup: string | null, now: Date): number | null {
  if (!lastBackup) return null
  const a = new Date(localDay(new Date(lastBackup)) + 'T00:00:00')
  const b = new Date(localDay(now) + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** Au-delà de ce nombre de jours sans sauvegarde, le rappel passe en alerte. */
export const STALE_AFTER_DAYS = 3

export function isStale(lastBackup: string | null, now: Date): boolean {
  const days = daysSince(lastBackup, now)
  return days === null || days > STALE_AFTER_DAYS
}

/** « aujourd'hui à 21 h 04 », « hier à 9 h 30 », « il y a 5 jours », « jamais ». */
export function describeLastBackup(lastBackup: string | null, now: Date): string {
  const days = daysSince(lastBackup, now)
  if (days === null || !lastBackup) return 'jamais'
  const at = new Date(lastBackup)
  const time = `${at.getHours()} h ${String(at.getMinutes()).padStart(2, '0')}`
  if (days <= 0) return `aujourd'hui à ${time}`
  if (days === 1) return `hier à ${time}`
  return `il y a ${days} jours`
}

/** Nombre de copies de sécurité gardées sur l'appareil. */
export const SNAPSHOTS_KEPT = 7

/** Faut-il prendre la copie automatique du jour ? */
export function needsDailySnapshot(snapshots: { createdAt: string; reason: string }[], now: Date): boolean {
  const today = localDay(now)
  return !snapshots.some((s) => s.reason === 'auto' && localDay(new Date(s.createdAt)) === today)
}

/** Identifiants des copies à supprimer : on garde les plus récentes. */
export function snapshotsToPrune(snapshots: { id: string; createdAt: string }[], keep = SNAPSHOTS_KEPT): string[] {
  return [...snapshots]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(keep)
    .map((s) => s.id)
}
