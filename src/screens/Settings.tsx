import { Download, Plus, ShieldCheck, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Money } from '../components/AnimatedAmount'
import { AccountIcon } from '../components/CategoryIcon'
import { Segmented } from '../components/Segmented'
import { downloadBackup, parseBackup, restoreBackup } from '../lib/backup'
import { accountTypeLabel } from '../lib/categories'
import { useAccounts } from '../lib/hooks'
import { getTheme, setTheme, type Theme } from '../lib/prefs'
import { generateRecurring } from '../lib/recurring'
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

  async function exportData() {
    setBusy(true)
    try {
      const backup = await downloadBackup()
      const { transactions, accounts: acc, recurring } = backup.data
      setStatus({
        kind: 'success',
        text: `Sauvegarde exportée : ${acc.length} compte(s), ${transactions.length} transaction(s), ${recurring.length} récurrent(s).`,
      })
    } catch {
      setStatus({ kind: 'error', text: "L'export a échoué. Réessayez ; si le problème persiste, libérez de l'espace." })
    } finally {
      setBusy(false)
    }
  }

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
          <div className="card empty-state">
            <p>Aucun compte pour l'instant. Ajoutez votre compte courant pour commencer.</p>
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
        <div className="card">
          <p className="body-muted">
            Exportez régulièrement une sauvegarde JSON pour ne rien perdre ou changer de téléphone.
          </p>
          <div className="backup-actions">
            <button type="button" className="btn btn-primary" onClick={exportData} disabled={busy}>
              <Download size={20} aria-hidden="true" />
              Exporter
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => fileInput.current?.click()} disabled={busy}>
              <Upload size={20} aria-hidden="true" />
              Importer
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
          </div>
          <p className="hint">L'import remplace l'intégralité des données actuelles, après confirmation.</p>
          {status && (
            <p className={`status ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
              {status.text}
            </p>
          )}
        </div>
      </section>

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
