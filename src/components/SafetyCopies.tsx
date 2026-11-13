import { useLiveQuery } from 'dexie-react-hooks'
import { History } from 'lucide-react'
import { SNAPSHOTS_KEPT } from '../lib/backupSchedule'
import { db } from '../lib/db'
import { generateRecurring } from '../lib/recurring'
import { restoreSnapshot } from '../lib/safety'
import { useToast } from '../lib/toast'
import type { Snapshot } from '../lib/types'

const REASONS: Record<Snapshot['reason'], string> = {
  auto: 'Copie du jour',
  import: 'Avant un import',
  restore: 'Avant une restauration',
}

const when = (iso: string) => {
  const text = new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Copies de sécurité locales : une par jour et une avant chaque import ou restauration, les 7 dernières.
 * Elles rattrapent une erreur (mauvais import, suppression), pas la suppression de l'app.
 */
export function SafetyCopies() {
  const snapshots = useLiveQuery(() => db.snapshots.orderBy('createdAt').reverse().toArray())
  const toast = useToast()
  if (!snapshots) return null

  const restore = async (s: Snapshot) => {
    const ok = confirm(
      `Revenir à la copie « ${REASONS[s.reason]} » du ${when(s.createdAt)} (${s.data.transactions.length} opération(s)) ?\n\nL'état actuel est d'abord copié : vous pourrez y revenir.`,
    )
    if (!ok) return
    await restoreSnapshot(s.id)
    await generateRecurring()
    toast({ message: 'Copie restaurée' })
  }

  return (
    <section aria-labelledby="copies-title" className="stack">
      <h2 id="copies-title" className="section-title">
        Copies de sécurité
      </h2>
      {snapshots.length === 0 ? (
        <p className="hint section-hint">
          Monetra garde une copie par jour et une avant chaque import, sur cet appareil. La première sera prise à la
          prochaine ouverture.
        </p>
      ) : (
        <>
          <ul className="list card card-flush" data-testid="safety-copies">
            {snapshots.map((s) => (
              <li key={s.id} className="row static">
                <span className="row-icon tint-compte">
                  <History size={20} aria-hidden="true" />
                </span>
                <span className="row-main">
                  <span className="row-title">{REASONS[s.reason]}</span>
                  <span className="row-meta row-meta--single">
                    {when(s.createdAt)} · {s.data.transactions.length} opération(s)
                  </span>
                </span>
                <button type="button" className="btn btn-link" onClick={() => void restore(s)}>
                  Restaurer
                </button>
              </li>
            ))}
          </ul>
          <p className="hint section-hint">
            Les {SNAPSHOTS_KEPT} dernières copies, gardées sur cet appareil : elles rattrapent un mauvais import ou une
            erreur, mais disparaissent avec l'app. Seule la sauvegarde dans Fichiers vous protège vraiment.
          </p>
        </>
      )}
    </section>
  )
}
