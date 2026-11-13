import { HardDriveDownload, X } from 'lucide-react'
import { daysSince, isBackupDue, isStale, localDay } from '../lib/backupSchedule'
import { setBackupPrefs } from '../lib/prefs'
import { useBackupPrefs, useNow, useSaveBackup } from '../lib/useBackup'

/**
 * Sauvegarde du jour : à partir de l'heure choisie dans Réglages, un bandeau propose d'enregistrer
 * le fichier dans l'app Fichiers. Un toucher ouvre la feuille de partage ; « Plus tard » le reporte à demain.
 * Ambre au-delà de 3 jours sans sauvegarde.
 */
export function BackupBanner() {
  const prefs = useBackupPrefs()
  const now = useNow()
  const { save, ready } = useSaveBackup()
  if (!prefs.enabled || !isBackupDue(now, prefs.time, prefs.lastBackup, prefs.snoozedDay)) return null

  const days = daysSince(prefs.lastBackup, now)
  const stale = isStale(prefs.lastBackup, now)
  const sub =
    days === null
      ? 'Aucune sauvegarde pour l’instant : un fichier dans l’app Fichiers vous protège.'
      : days === 1
        ? 'Dernière sauvegarde : hier.'
        : `Dernière sauvegarde : il y a ${days} jours.`

  return (
    <section className={`backup-banner${stale ? ' stale' : ''}`} aria-labelledby="backup-banner-title" data-testid="backup-banner">
      <span className="backup-banner-icon" aria-hidden="true">
        <HardDriveDownload size={22} />
      </span>
      <div className="backup-banner-text">
        <h2 id="backup-banner-title">Sauvegarde du jour</h2>
        <p>{sub}</p>
      </div>
      <button type="button" className="btn btn-light backup-banner-action" onClick={() => void save()} disabled={!ready}>
        Sauvegarder
      </button>
      <button
        type="button"
        className="backup-banner-close"
        aria-label="Plus tard (demain)"
        onClick={() => setBackupPrefs({ snoozedDay: localDay(now) })}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </section>
  )
}
