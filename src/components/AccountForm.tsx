import { useState, type FormEvent } from 'react'
import { ACCOUNT_TYPES } from '../lib/categories'
import { amountToInput, parseAmount } from '../lib/format'
import { deleteAccount, saveAccount } from '../lib/mutations'
import type { Account, AccountType } from '../lib/types'

interface Props {
  account?: Account
  onDone: () => void
}

export function AccountForm({ account, onDone }: Props) {
  const [nom, setNom] = useState(account?.nom ?? '')
  const [type, setType] = useState<AccountType>(account?.type ?? 'courant')
  const [banque, setBanque] = useState(account?.banque ?? '')
  const [solde, setSolde] = useState(account ? amountToInput(account.solde) : '')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const raw = solde.trim()
    const negative = raw.startsWith('-')
    const value = raw === '' ? 0 : parseAmount(negative ? raw.slice(1) : raw)
    if (Number.isNaN(value)) return setError('Solde invalide.')
    if (!nom.trim()) return setError('Donnez un nom au compte.')
    await saveAccount({ id: account?.id, nom: nom.trim(), type, banque: banque.trim(), solde: negative ? -value : value })
    onDone()
  }

  async function remove() {
    if (!account || !confirm(`Supprimer le compte « ${account.nom} » ?`)) return
    const result = await deleteAccount(account.id)
    if (!result.ok) return setError(result.reason)
    onDone()
  }

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span>Nom</span>
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Compte courant" autoFocus={!account} />
      </label>
      <label className="field">
        <span>Type</span>
        <select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Banque</span>
        <input value={banque} onChange={(e) => setBanque(e.target.value)} placeholder="Optionnel" />
      </label>
      <label className="field">
        <span>Solde actuel (€)</span>
        <input inputMode="decimal" value={solde} onChange={(e) => setSolde(e.target.value)} placeholder="0,00" />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {account && (
          <button type="button" className="button danger" onClick={remove}>
            Supprimer
          </button>
        )}
        <button type="submit" className="button primary grow">
          {account ? 'Enregistrer' : 'Créer le compte'}
        </button>
      </div>
    </form>
  )
}
