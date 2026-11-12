import { CalendarDays } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORY } from '../lib/categories'
import { addDays, formatShortDate, today } from '../lib/dates'
import { amountToInput, formatMoney, parseAmount } from '../lib/format'
import { useAccounts } from '../lib/hooks'
import { addTransaction, deleteTransaction, restoreTransaction, updateTransaction } from '../lib/mutations'
import { getLastAccount, setLastAccount } from '../lib/prefs'
import { haptic } from '../lib/motion'
import { useToast } from '../lib/toast'
import type { CategoryId, Transaction, TransactionType } from '../lib/types'
import { AccountIcon, CategoryIcon } from './CategoryIcon'
import { Segmented } from './Segmented'

interface Props {
  transaction?: Transaction
  /** Type proposé à l'ouverture (boutons « Dépense » / « Revenu » de l'accueil). */
  initialType?: TransactionType
  onDone: () => void
  onNeedAccount: () => void
}

type Errors = Partial<Record<'amount' | 'category', string>>

export function TransactionForm({ transaction, initialType, onDone, onNeedAccount }: Props) {
  const accounts = useAccounts()
  const toast = useToast()
  const ids = { amount: useId(), amountError: useId(), categoryError: useId() }
  const [type, setType] = useState<TransactionType>(transaction?.type ?? initialType ?? 'depense')
  const [amount, setAmount] = useState(transaction ? amountToInput(transaction.montant) : '')
  const [categorie, setCategorie] = useState<CategoryId | null>(
    transaction && transaction.type === 'depense' ? transaction.categorie : null,
  )
  const [compteId, setCompteId] = useState<string | null>(transaction?.compteId ?? null)
  const [date, setDate] = useState(transaction?.date ?? today())
  const [note, setNote] = useState(transaction?.note ?? '')
  const todayDate = today()
  const yesterday = addDays(todayDate, -1)
  // « Autre date » : ouverte d'emblée quand on modifie une opération d'un autre jour.
  const [otherDate, setOtherDate] = useState(
    Boolean(transaction && transaction.date !== todayDate && transaction.date !== yesterday),
  )
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  if (!accounts) return null

  if (accounts.length === 0) {
    return (
      <div className="empty-state">
        <p>Créez d'abord un compte pour pouvoir saisir des transactions.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={onNeedAccount}>
          Créer un compte
        </button>
      </div>
    )
  }

  const lastAccount = getLastAccount()
  const selectedAccount =
    compteId ?? (accounts.some((a) => a.id === lastAccount) ? lastAccount! : accounts[0].id)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const montant = parseAmount(amount)
    const cat: CategoryId | null = type === 'revenu' ? INCOME_CATEGORY.id : categorie
    const next: Errors = {}
    if (!(montant > 0)) next.amount = 'Saisissez un montant supérieur à 0, par exemple 12,50.'
    if (!cat) next.category = 'Choisissez une catégorie pour cette dépense.'
    setErrors(next)
    if (next.amount || next.category) haptic('error')
    if (next.amount) return document.getElementById(ids.amount)?.focus()
    if (next.category || !cat) return

    const data: Omit<Transaction, 'id'> = {
      date,
      montant,
      type,
      categorie: cat,
      compteId: selectedAccount,
      note: note.trim(),
      ...(transaction?.recurringId ? { recurringId: transaction.recurringId } : {}),
    }
    setSaving(true)
    try {
      if (transaction) await updateTransaction(transaction.id, data)
      else await addTransaction(data)
      setLastAccount(selectedAccount)
      haptic('success')
      toast({
        message: transaction
          ? 'Transaction modifiée'
          : `${type === 'revenu' ? 'Revenu' : 'Dépense'} de ${formatMoney(montant)} ajouté${type === 'revenu' ? '' : 'e'}`,
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!transaction) return
    setSaving(true)
    await deleteTransaction(transaction.id)
    toast({
      message: 'Transaction supprimée',
      action: { label: 'Annuler', onAction: () => void restoreTransaction(transaction) },
    })
    onDone()
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Segmented
        label="Type de transaction"
        value={type}
        onChange={(v) => {
          setType(v)
          setErrors({})
        }}
        options={[
          { value: 'depense', label: 'Dépense' },
          { value: 'revenu', label: 'Revenu' },
        ]}
      />

      <div className={`amount-field ${type}${errors.amount ? ' invalid' : ''}`}>
        <label htmlFor={ids.amount} className="field-label">
          Montant
        </label>
        <div className="amount-input">
          <input
            id={ids.amount}
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            placeholder="0,00"
            value={amount}
            autoFocus={!transaction}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? ids.amountError : undefined}
            onChange={(e) => {
              setAmount(e.target.value)
              if (errors.amount) setErrors((x) => ({ ...x, amount: undefined }))
            }}
          />
          <span className="currency" aria-hidden="true">
            €
          </span>
        </div>
        {errors.amount && (
          <p id={ids.amountError} className="field-error" role="alert">
            {errors.amount}
          </p>
        )}
      </div>

      {type === 'depense' && (
        <fieldset className="fieldset">
          <legend className="field-label">Catégorie</legend>
          <div
            className="category-grid"
            role="radiogroup"
            aria-label="Catégorie"
            aria-describedby={errors.category ? ids.categoryError : undefined}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={categorie === c.id}
                className={`choice tint-${c.id}`}
                onClick={() => {
                  setCategorie(c.id)
                  setErrors((x) => ({ ...x, category: undefined }))
                }}
              >
                <CategoryIcon categorie={c.id} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          {errors.category && (
            <p id={ids.categoryError} className="field-error" role="alert">
              {errors.category}
            </p>
          )}
        </fieldset>
      )}

      {accounts.length > 1 && (
        <fieldset className="fieldset">
          <legend className="field-label">Compte</legend>
          <div className="chip-wrap" role="radiogroup" aria-label="Compte">
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={selectedAccount === a.id}
                className="chip"
                onClick={() => setCompteId(a.id)}
              >
                <AccountIcon type={a.type} size={16} />
                {a.nom}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <label className="field">
        <span className="field-label">Libellé</span>
        <input value={note} placeholder="Facultatif, ex. Boulangerie" onChange={(e) => setNote(e.target.value)} />
      </label>

      {/* Date : les deux cas fréquents en un toucher, le reste dans le sélecteur du système. */}
      <fieldset className="fieldset">
        <legend className="field-label">Date</legend>
        <div className="chip-wrap" role="radiogroup" aria-label="Date">
          {[
            { value: todayDate, label: "Aujourd'hui" },
            { value: yesterday, label: 'Hier' },
          ].map((d) => (
            <button
              key={d.label}
              type="button"
              role="radio"
              aria-checked={!otherDate && date === d.value}
              className="chip"
              onClick={() => {
                setOtherDate(false)
                setDate(d.value)
              }}
            >
              {d.label}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={otherDate}
            className="chip"
            onClick={() => setOtherDate(true)}
          >
            <CalendarDays size={16} aria-hidden="true" />
            {otherDate ? formatShortDate(date) : 'Autre date'}
          </button>
        </div>
        {otherDate && (
          <input
            className="date-input"
            type="date"
            aria-label="Choisir la date"
            value={date}
            required
            onChange={(e) => setDate(e.target.value || todayDate)}
          />
        )}
      </fieldset>

      {transaction?.recurringId && (
        <p className="hint">Générée par un récurrent : seule cette occurrence est modifiée.</p>
      )}

      <div className="form-actions">
        {transaction && (
          <button type="button" className="btn btn-danger" onClick={remove} disabled={saving}>
            Supprimer
          </button>
        )}
        <button type="submit" className="btn btn-primary grow" disabled={saving}>
          {transaction ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}
