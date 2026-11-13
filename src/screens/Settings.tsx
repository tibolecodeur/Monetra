import { ChevronRight, CircleCheck, Download, Plus, ShieldCheck, TriangleAlert, Upload, Wallet } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { useRef, useState, type ChangeEvent } from 'react'
import { Money } from '../components/AnimatedAmount'
import { AccountIcon } from '../components/CategoryIcon'
import { Segmented } from '../components/Segmented'
import { parseBackup, restoreBackup } from '../lib/backup'
import { describeLastBackup, isStale } from '../lib/backupSchedule'
import { useBackupPrefs, useNow, useSaveBackup } from '../lib/useBackup'
import { SafetyCopies } from '../components/SafetyCopies'
import { accountTypeLabel } from '../lib/categories'
import { useAccounts } from '../lib/hooks'
import { getTheme, setBackupPrefs, setTheme, type Theme } from '../lib/prefs'
import { generateRecurring } from '../lib/recurring'
import { takeSnapshot } from '../lib/safety'
import type { Account } from '../lib/types'
import { NavHeader } from '../components/NavHeader'

interface Props {
  onAddAccount: () => void
  onSelectAccount: (a: Account) => void
}

type Status = { kind: 'success' | 'error'; text: string } | null

export function Settings({ onAddAccount, onSelectAccount }: Props) {
  const accounts = useAccounts()
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>(null)
  const [busy, setBusy] = useState(false)
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const prefs = useBackupPrefs()
  const now = useNow()
  const stale = isStale(prefs.lastBackup, now)
  const { save, ready } = useSaveBackup()

  async function importData(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const backup = parseBackup(await file.text())
      const { transactions, accounts: acc } = backup.data
      const when = new Date(backup.exportedAt).toLocaleString('fr-FR')
      const ok = confirm(
        `Importer la sauvegarde du ${when} (${acc.length} compte(s), ${transactions.length} transaction(s)) ?\n\nToutes les données actuelles seront remplacées.`,
      )
      if (!ok) return
      // Copie de l'état actuel d'abord : un import se défait depuis « Copies de sécurité ».
      await takeSnapshot('import')
      await restoreBackup(backup)
      await generateRecurring()
      setStatus({ kind: 'success', text: 'Sauvegarde importée.' })
    } catch (err) {
      const reason = err instanceof Error ? err.message : "L'import a échoué."
      setStatus({ kind: 'error', text: `${reason} Choisissez un fichier exporté depuis Monetra.` })
    } finally {
      setBusy(false)
    }
  }

  if (!accounts) return <div className="screen" aria-busy="true" />
  const total = accounts.reduce((s, a) => s + a.solde, 0)

  return (
    <div className="screen">
      <NavHeader title="Réglages" />

      {accounts.length > 0 && (
        <section className="summary" aria-label="Patrimoine">
          <p className="summary-label">Total de vos comptes</p>
          <p className={`summary-value amount${total < 0 ? ' negative' : ''}`}>
            <Money value={total} />
          </p>
        </section>
      )}

      <section aria-labelledby="accounts-title" className="stack">
        <h2 id="accounts-title" className="section-title">
          Comptes
        </h2>
        {accounts.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Wallet}
              title="Aucun compte"
              text="Ajoutez votre compte courant avec son solde actuel : tout le reste en découle."
            />
          </div>
        ) : (
          <ul className="list card card-flush">
            {accounts.map((a) => (
              <li key={a.id}>
                <button type="button" className="row" onClick={() => onSelectAccount(a)}>
                  <span className="row-icon tint-compte">
                    <AccountIcon type={a.type} />
                  </span>
                  <span className="row-main">
                    <span className="row-title">{a.nom}</span>
                    <span className="row-meta row-meta--single">{[accountTypeLabel(a.type), a.banque].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className={`amount${a.solde < 0 ? ' negative' : ''}`}>
                    <Money value={a.solde} />
                  </span>
                  <ChevronRight size={18} className="row-chevron" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn-secondary" onClick={onAddAccount}>
          <Plus size={20} aria-hidden="true" />
          Ajouter un compte
        </button>
      </section>

      <section aria-labelledby="appearance-title" className="stack">
        <h2 id="appearance-title" className="section-title">
          Apparence
        </h2>
        <Segmented
          label="Thème"
          value={theme}
          onChange={(t) => {
            setThemeState(t)
            setTheme(t)
          }}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'dark', label: 'Sombre' },
            { value: 'light', label: 'Clair' },
          ]}
        />
        <p className="hint section-hint">Auto suit l'apparence de votre téléphone, de jour comme de nuit.</p>
      </section>

      <section aria-labelledby="backup-title" className="stack">
        <h2 id="backup-title" className="section-title">
          Sauvegarde
        </h2>
        <div className="card backup-card">
          <p className={`backup-last${stale ? ' stale' : ''}`} data-testid="last-backup">
            {stale ? <TriangleAlert size={18} aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />}
            Dernière sauvegarde : {describeLastBackup(prefs.lastBackup, now)}
          </p>
          <p className="body-muted">
            Enregistrez le fichier dans l'app Fichiers (iCloud Drive, par exemple dans un dossier « Monetra ») : c'est
            la seule copie qui survit si l'app est supprimée ou le téléphone changé.
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => void save()} disabled={busy || !ready}>
            <Download size={20} aria-hidden="true" />
            Sauvegarder maintenant
          </button>

          <div className="backup-reminder">
            <label className="switch-row">
              <span>
                <span className="switch-title">Rappel quotidien</span>
                <span className="switch-sub">Un bandeau sur l'accueil, à partir de l'heure choisie</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="switch"
                checked={prefs.enabled}
                onChange={(e) => setBackupPrefs({ enabled: e.target.checked })}
              />
            </label>
            {prefs.enabled && (
              <label className="switch-row">
                <span className="switch-title">Heure du rappel</span>
                <input
                  type="time"
                  className="time-input"
                  value={prefs.time}
                  required
                  onChange={(e) => e.target.value && setBackupPrefs({ time: e.target.value })}
                />
              </label>
            )}
          </div>

          <button type="button" className="btn btn-secondary" onClick={() => fileInput.current?.click()} disabled={busy}>
            <Upload size={20} aria-hidden="true" />
            Importer une sauvegarde
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={importData}
            data-testid="import-input"
          />
          <p className="hint">
            L'import remplace toutes les données actuelles, après confirmation. Une copie de sécurité est prise juste
            avant : il se défait depuis « Copies de sécurité ».
          </p>
          {status && (
            <p className={`status ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
              {status.text}
            </p>
          )}
        </div>

        <div className="card warning-card" role="note">
          <TriangleAlert size={22} aria-hidden="true" />
          <p>
            <strong>Supprimer Monetra de l'écran d'accueil efface toutes ses données.</strong> Sauvegardez dans Fichiers
            avant de la supprimer ou de la réinstaller.
          </p>
        </div>
      </section>

      <SafetyCopies />

      <div className="card privacy">
        <ShieldCheck size={24} aria-hidden="true" />
        <p>
          <strong>100 % local.</strong> Vos données sont stockées uniquement sur cet appareil et ne sont jamais
          envoyées à un serveur.
        </p>
      </div>
    </div>
  )
}
