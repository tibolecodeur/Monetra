import { useId, useState, type FormEvent } from 'react'
import { ACCOUNT_TYPES } from '../lib/categories'
import { amountToInput, parseAmount } from '../lib/format'
import { deleteAccount, saveAccount } from '../lib/mutations'
import { useToast } from '../lib/toast'
import type { Account, AccountType } from '../lib/types'

interface Props {
  account?: Account
  onDone: () => void
}

type Errors = Partial<Record<'nom' | 'solde' | 'form', string>>

export function AccountForm({ account, onDone }: Props) {
  const toast = useToast()
  const ids = { nom: useId(), solde: useId() }
  const [nom, setNom] = useState(account?.nom ?? '')
  const [type, setType] = useState<AccountType>(account?.type ?? 'courant')
  const [banque, setBanque] = useState(account?.banque ?? '')
  const [solde, setSolde] = useState(account ? amountToInput(account.solde) : '')
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const raw = solde.trim()
    const negative = raw.startsWith('-')
    const value = raw === '' ? 0 : parseAmount(negative ? raw.slice(1) : raw)
    const next: Errors = {}
    if (!nom.trim()) next.nom = 'Donnez un nom au compte, par exemple « Compte courant ».'
    if (Number.isNaN(value)) next.solde = 'Solde invalide : utilisez des chiffres, par exemple 1250,40 ou -30.'
    setErrors(next)
    if (next.nom) return document.getElementById(ids.nom)?.focus()
    if (next.solde) return document.getElementById(ids.solde)?.focus()
    setSaving(true)
    await saveAccount({ id: account?.id, nom: nom.trim(), type, banque: banque.trim(), solde: negative ? -value : value })
    toast({ message: account ? 'Compte modifié' : 'Compte créé' })
    onDone()
  }

  async function remove() {
    if (!account || !confirm(`Supprimer le compte « ${account.nom} » ?`)) return
    const result = await deleteAccount(account.id)
    if (!result.ok) return setErrors({ form: `${result.reason} Supprimez-les ou rattachez-les à un autre compte d'abord.` })
    toast({ message: 'Compte supprimé' })
    onDone()
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <label className="field">
        <span className="field-label">Nom</span>
        <input
          id={ids.nom}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. Compte courant"
          autoFocus={!account}
          aria-invalid={Boolean(errors.nom)}
          aria-describedby={errors.nom ? `${ids.nom}-error` : undefined}
        />
        {errors.nom && (
          <span id={`${ids.nom}-error`} className="field-error" role="alert">
            {errors.nom}
          </span>
        )}
      </label>
      <label className="field">
        <span className="field-label">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Banque (optionnel)</span>
        <input value={banque} onChange={(e) => setBanque(e.target.value)} autoComplete="organization" />
      </label>
      <label className="field">
        <span className="field-label">Solde actuel (€)</span>
        <input
          id={ids.solde}
          inputMode="decimal"
          value={solde}
          onChange={(e) => setSolde(e.target.value)}
          placeholder="0,00"
          aria-invalid={Boolean(errors.solde)}
          aria-describedby={`${ids.solde}-hint${errors.solde ? ` ${ids.solde}-error` : ''}`}
        />
        <span id={`${ids.solde}-hint`} className="hint">
          Il évolue ensuite automatiquement avec vos transactions.
        </span>
        {errors.solde && (
          <span id={`${ids.solde}-error`} className="field-error" role="alert">
            {errors.solde}
          </span>
        )}
      </label>
      {errors.form && (
        <p className="field-error" role="alert">
          {errors.form}
        </p>
      )}
      <div className="form-actions">
        {account && (
          <button type="button" className="btn btn-danger" onClick={remove} disabled={saving}>
            Supprimer
          </button>
        )}
        <button type="submit" className="btn btn-primary grow" disabled={saving}>
          {account ? 'Enregistrer' : 'Créer le compte'}
        </button>
      </div>
    </form>
  )
}
