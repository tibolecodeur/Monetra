import { useState, type FormEvent } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORY } from '../lib/categories'
import { today } from '../lib/dates'
import { amountToInput, parseAmount } from '../lib/format'
import { useAccounts } from '../lib/hooks'
import { addTransaction, deleteTransaction, updateTransaction } from '../lib/mutations'
import { getLastAccount, setLastAccount } from '../lib/prefs'
import type { CategoryId, Transaction, TransactionType } from '../lib/types'
import { Segmented } from './Segmented'

interface Props {
  transaction?: Transaction
  onDone: () => void
  onNeedAccount: () => void
}

export function TransactionForm({ transaction, onDone, onNeedAccount }: Props) {
  const accounts = useAccounts()
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'depense')
  const [amount, setAmount] = useState(transaction ? amountToInput(transaction.montant) : '')
  const [categorie, setCategorie] = useState<CategoryId | null>(
    transaction && transaction.type === 'depense' ? transaction.categorie : null,
  )
  const [compteId, setCompteId] = useState<string | null>(transaction?.compteId ?? null)
  const [date, setDate] = useState(transaction?.date ?? today())
  const [note, setNote] = useState(transaction?.note ?? '')
  const [showMore, setShowMore] = useState(Boolean(transaction))
  const [error, setError] = useState<string | null>(null)

  if (!accounts) return null

  if (accounts.length === 0) {
    return (
      <div className="empty-state">
        <p>Créez d'abord un compte pour pouvoir saisir des transactions.</p>
        <button type="button" className="button primary" onClick={onNeedAccount}>
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
    if (!(montant > 0)) return setError('Saisissez un montant.')
    const cat: CategoryId | null = type === 'revenu' ? INCOME_CATEGORY.id : categorie
    if (!cat) return setError('Choisissez une catégorie.')
    const data: Omit<Transaction, 'id'> = {
      date,
      montant,
      type,
      categorie: cat,
      compteId: selectedAccount,
      note: note.trim(),
      ...(transaction?.recurringId ? { recurringId: transaction.recurringId } : {}),
    }
    if (transaction) await updateTransaction(transaction.id, data)
    else await addTransaction(data)
    setLastAccount(selectedAccount)
    onDone()
  }

  async function remove() {
    if (!transaction) return
    if (!confirm('Supprimer cette transaction ?')) return
    await deleteTransaction(transaction.id)
    onDone()
  }

  return (
    <form className="form" onSubmit={submit}>
      <Segmented
        label="Type"
        value={type}
        onChange={(v) => {
          setType(v)
          setError(null)
        }}
        options={[
          { value: 'depense', label: 'Dépense' },
          { value: 'revenu', label: 'Revenu' },
        ]}
      />

      <label className={`amount-field ${type}`}>
        <span className="sr-only">Montant</span>
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={amount}
          autoFocus={!transaction}
          onChange={(e) => {
            setAmount(e.target.value)
            setError(null)
          }}
          aria-label="Montant en euros"
        />
        <span className="currency">€</span>
      </label>

      {type === 'depense' && (
        <div className="category-grid" role="radiogroup" aria-label="Catégorie">
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={categorie === c.id}
              className={`category-chip${categorie === c.id ? ' active' : ''}`}
              onClick={() => {
                setCategorie(c.id)
                setError(null)
              }}
            >
              <span className="emoji" aria-hidden="true">
                {c.emoji}
              </span>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {accounts.length > 1 && (
        <div className="chip-row" role="radiogroup" aria-label="Compte">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={selectedAccount === a.id}
              className={`chip${selectedAccount === a.id ? ' active' : ''}`}
              onClick={() => setCompteId(a.id)}
            >
              {a.nom}
            </button>
          ))}
        </div>
      )}

      {showMore ? (
        <div className="field-row">
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field grow">
            <span>Note</span>
            <input value={note} placeholder="Optionnel" onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
      ) : (
        <button type="button" className="link-button" onClick={() => setShowMore(true)}>
          + Date, note
        </button>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        {transaction && (
          <button type="button" className="button danger" onClick={remove}>
            Supprimer
          </button>
        )}
        <button type="submit" className="button primary grow">
          {transaction ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
      {transaction?.recurringId && <p className="hint">Générée par un récurrent : seule cette occurrence est modifiée.</p>}
    </form>
  )
}
