import { useState, type FormEvent } from 'react'
import { useToast } from '../lib/toast'
import { EXPENSE_CATEGORIES, INCOME_CATEGORY } from '../lib/categories'
import { currentMonth } from '../lib/dates'
import { amountToInput, parseAmount } from '../lib/format'
import { useAccounts } from '../lib/hooks'
import { deleteRecurring, saveRecurring } from '../lib/mutations'
import { generateRecurring } from '../lib/recurring'
import type { CategoryId, Recurring, TransactionType } from '../lib/types'
import { Segmented } from './Segmented'

interface Props {
  recurring?: Recurring
  onDone: () => void
  onNeedAccount: () => void
}

export function RecurringForm({ recurring, onDone, onNeedAccount }: Props) {
  const accounts = useAccounts()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [type, setType] = useState<TransactionType>(recurring?.type ?? 'depense')
  const [libelle, setLibelle] = useState(recurring?.libelle ?? '')
  const [amount, setAmount] = useState(recurring ? amountToInput(recurring.montant) : '')
  const [jour, setJour] = useState(String(recurring?.jourDuMois ?? 1))
  const [categorie, setCategorie] = useState<CategoryId>(
    recurring && recurring.type === 'depense' ? recurring.categorie : 'abonnements',
  )
  const [compteId, setCompteId] = useState(recurring?.compteId ?? '')
  const [debut, setDebut] = useState(recurring?.dateDebut.slice(0, 7) ?? currentMonth())
  const [dateFin, setDateFin] = useState(recurring?.dateFin ?? '')
  const [error, setError] = useState<string | null>(null)

  if (!accounts) return null
  if (accounts.length === 0) {
    return (
      <div className="empty-state">
        <p>Créez d'abord un compte pour y rattacher vos récurrents.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={onNeedAccount}>
          Créer un compte
        </button>
      </div>
    )
  }
  const account = compteId || accounts[0].id

  async function submit(e: FormEvent) {
    e.preventDefault()
    const montant = parseAmount(amount)
    const jourDuMois = Number(jour)
    if (!libelle.trim()) return setError('Donnez un libellé, par exemple « Loyer ».')
    if (!(montant > 0)) return setError('Saisissez un montant supérieur à 0, par exemple 9,99.')
    if (!Number.isInteger(jourDuMois) || jourDuMois < 1 || jourDuMois > 31)
      return setError('Le jour du mois doit être compris entre 1 et 31.')
    const dateDebut = `${debut}-01`
    if (dateFin && dateFin < dateDebut) return setError('La date de fin doit être après le mois de début.')
    setSaving(true)
    await saveRecurring({
      ...recurring,
      libelle: libelle.trim(),
      montant,
      type,
      jourDuMois,
      categorie: type === 'revenu' ? INCOME_CATEGORY.id : categorie,
      compteId: account,
      dateDebut,
      dateFin: dateFin || undefined,
    })
    const created = await generateRecurring()
    toast({
      message: created > 0 ? `Récurrent enregistré · ${created} transaction(s) créée(s)` : 'Récurrent enregistré',
    })
    onDone()
  }

  async function remove() {
    if (!recurring) return
    if (!confirm(`Supprimer « ${recurring.libelle} » ? Les transactions déjà générées sont conservées.`)) return
    await deleteRecurring(recurring.id)
    toast({ message: 'Récurrent supprimé' })
    onDone()
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Segmented
        label="Type"
        value={type}
        onChange={setType}
        options={[
          { value: 'depense', label: 'Charge' },
          { value: 'revenu', label: 'Revenu' },
        ]}
      />
      <label className="field">
        <span className="field-label">Libellé</span>
        <input
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          placeholder={type === 'revenu' ? 'Ex. Salaire' : 'Ex. Loyer'}
          autoFocus={!recurring}
        />
      </label>
      <div className="field-row">
        <label className="field grow">
          <span className="field-label">Montant (€)</span>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        </label>
        <label className="field narrow">
          <span className="field-label">Jour du mois</span>
          <input type="number" inputMode="numeric" min={1} max={31} value={jour} onChange={(e) => setJour(e.target.value)} />
        </label>
      </div>
      {type === 'depense' && (
        <label className="field">
          <span className="field-label">Catégorie</span>
          <select value={categorie} onChange={(e) => setCategorie(e.target.value as CategoryId)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="field">
        <span className="field-label">Compte</span>
        <select value={account} onChange={(e) => setCompteId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>
      </label>
      <div className="field-row">
        <label className="field grow">
          <span className="field-label">À partir de</span>
          <input type="month" value={debut} required onChange={(e) => setDebut(e.target.value)} />
        </label>
        <label className="field grow">
          <span className="field-label">Fin (optionnel)</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </label>
      </div>
      <p className="hint">
        La transaction est créée automatiquement chaque mois au jour indiqué (dernier jour du mois si besoin).
      </p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {recurring && (
          <button type="button" className="btn btn-danger" onClick={remove} disabled={saving}>
            Supprimer
          </button>
        )}
        <button type="submit" className="btn btn-primary grow" disabled={saving}>
          {recurring ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}
