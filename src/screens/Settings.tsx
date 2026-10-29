import { useRef, useState, type ChangeEvent } from 'react'
import { DownloadIcon, UploadIcon } from '../components/Icons'
import { downloadBackup, parseBackup, restoreBackup } from '../lib/backup'
import { accountTypeLabel } from '../lib/categories'
import { formatMoney } from '../lib/format'
import { useAccounts } from '../lib/hooks'
import { generateRecurring } from '../lib/recurring'
import type { Account } from '../lib/types'

interface Props {
  onAddAccount: () => void
  onSelectAccount: (a: Account) => void
}

type Status = { kind: 'success' | 'error'; text: string } | null

export function Settings({ onAddAccount, onSelectAccount }: Props) {
  const accounts = useAccounts()
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>(null)

  async function exportData() {
    try {
      const backup = await downloadBackup()
      const { transactions, accounts: acc, recurring } = backup.data
      setStatus({
        kind: 'success',
        text: `Sauvegarde exportée : ${acc.length} compte(s), ${transactions.length} transaction(s), ${recurring.length} récurrent(s).`,
      })
    } catch {
      setStatus({ kind: 'error', text: "L'export a échoué." })
    }
  }

  async function importData(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
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
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : "L'import a échoué." })
    }
  }

  if (!accounts) return null
  const total = accounts.reduce((s, a) => s + a.solde, 0)

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Réglages</h1>
      </header>

      <div className="card-title-row">
        <h2 className="section-title">Comptes</h2>
        <button type="button" className="button primary small" onClick={onAddAccount}>
          + Compte
        </button>
      </div>
      {accounts.length === 0 ? (
        <p className="card muted">Aucun compte pour l'instant.</p>
      ) : (
        <ul className="tx-list card">
          {accounts.map((a) => (
            <li key={a.id}>
              <button type="button" className="tx-row" onClick={() => onSelectAccount(a)}>
                <span className="tx-main">
                  <span className="tx-title">{a.nom}</span>
                  <span className="tx-meta">{[accountTypeLabel(a.type), a.banque].filter(Boolean).join(' · ')}</span>
                </span>
                <span className={`tx-amount${a.solde < 0 ? ' depense' : ''}`}>{formatMoney(a.solde)}</span>
              </button>
            </li>
          ))}
          <li className="total-row">
            <span>Total</span>
            <strong>{formatMoney(total)}</strong>
          </li>
        </ul>
      )}

      <h2 className="section-title">Sauvegarde</h2>
      <section className="card">
        <p className="muted">
          Vos données sont stockées uniquement sur cet appareil. Exportez régulièrement une sauvegarde JSON pour ne rien
          perdre ou changer de téléphone.
        </p>
        <div className="backup-actions">
          <button type="button" className="button primary" onClick={exportData}>
            <DownloadIcon /> Exporter
          </button>
          <button type="button" className="button" onClick={() => fileInput.current?.click()}>
            <UploadIcon /> Importer
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            onChange={importData}
            data-testid="import-input"
          />
        </div>
        <p className="hint">L'import remplace l'intégralité des données actuelles.</p>
        {status && (
          <p className={`status ${status.kind}`} role="status">
            {status.text}
          </p>
        )}
      </section>

      <p className="footnote">Monetra · 100 % local, aucune donnée envoyée.</p>
    </div>
  )
}
