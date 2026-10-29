import { useState, type FormEvent } from 'react'
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
        <button type="button" className="button primary" onClick={onNeedAccount}>
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
    if (!libelle.trim()) return setError('Donnez un libellé.')
    if (!(montant > 0)) return setError('Saisissez un montant.')
    if (!Number.isInteger(jourDuMois) || jourDuMois < 1 || jourDuMois > 31) return setError('Jour entre 1 et 31.')
    const dateDebut = `${debut}-01`
    if (dateFin && dateFin < dateDebut) return setError('La date de fin précède le début.')
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
    await generateRecurring()
    onDone()
  }

  async function remove() {
    if (!recurring) return
    if (!confirm(`Supprimer « ${recurring.libelle} » ? Les transactions déjà générées sont conservées.`)) return
    await deleteRecurring(recurring.id)
    onDone()
  }

  return (
    <form className="form" onSubmit={submit}>
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
        <span>Libellé</span>
        <input
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          placeholder={type === 'revenu' ? 'Ex. Salaire' : 'Ex. Loyer'}
          autoFocus={!recurring}
        />
      </label>
      <div className="field-row">
        <label className="field grow">
          <span>Montant (€)</span>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        </label>
        <label className="field narrow">
          <span>Jour du mois</span>
          <input type="number" inputMode="numeric" min={1} max={31} value={jour} onChange={(e) => setJour(e.target.value)} />
        </label>
      </div>
      {type === 'depense' && (
        <label className="field">
          <span>Catégorie</span>
          <select value={categorie} onChange={(e) => setCategorie(e.target.value as CategoryId)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="field">
        <span>Compte</span>
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
          <span>À partir de</span>
          <input type="month" value={debut} required onChange={(e) => setDebut(e.target.value)} />
        </label>
        <label className="field grow">
          <span>Date de fin</span>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </label>
      </div>
      <p className="hint">
        La transaction est créée automatiquement chaque mois au jour indiqué (dernier jour du mois si besoin).
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {recurring && (
          <button type="button" className="button danger" onClick={remove}>
            Supprimer
          </button>
        )}
        <button type="submit" className="button primary grow">
          {recurring ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}
