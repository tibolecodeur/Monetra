import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { backupFile, collectData, saveBackupFile, toBackup } from './backup'
import { getBackupPrefs, setBackupPrefs, subscribeBackupPrefs, type BackupPrefs } from './prefs'
import { useToast } from './toast'

let cached = getBackupPrefs()
const snapshot = () => cached
const subscribe = (fn: () => void) =>
  subscribeBackupPrefs(() => {
    cached = getBackupPrefs()
    fn()
  })

export function useBackupPrefs(): BackupPrefs {
  return useSyncExternalStore(subscribe, snapshot)
}

/**
 * Fichier de sauvegarde préparé à l'avance et tenu à jour : au toucher, la feuille de partage s'ouvre
 * sans attendre la base (Safari refuse de l'ouvrir si un délai sépare le geste de l'appel).
 */
export function usePreparedBackupFile(): File | null {
  const data = useLiveQuery(() => collectData())
  return useMemo(() => (data ? backupFile(toBackup(data)) : null), [data])
}

/** Heure courante, rafraîchie chaque minute (le rappel apparaît à l'heure choisie, app ouverte). */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date())
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return now
}

/**
 * Action « Sauvegarder » : ouvre la feuille de partage (ou télécharge) avec le fichier préparé,
 * puis retient l'heure de la sauvegarde. Annuler la feuille ne compte pas comme une sauvegarde.
 */
export function useSaveBackup() {
  const file = usePreparedBackupFile()
  const toast = useToast()
  const save = async () => {
    if (!file) return
    try {
      const outcome = await saveBackupFile(file)
      if (outcome === 'cancelled') return
      setBackupPrefs({ lastBackup: new Date().toISOString() })
      toast({ message: outcome === 'shared' ? 'Sauvegarde enregistrée' : `Sauvegarde téléchargée : ${file.name}` })
    } catch {
      toast({ message: "La sauvegarde a échoué. Réessayez." })
    }
  }
  return { ready: file !== null, save, fileName: file?.name ?? null }
}
