import { getCategory } from '../lib/categories'
import { formatMoney } from '../lib/format'
import type { Transaction } from '../lib/types'

interface Props {
  transaction: Transaction
  accountName?: string
  onSelect?: (t: Transaction) => void
  dateLabel?: string
}

export function TransactionRow({ transaction: t, accountName, onSelect, dateLabel }: Props) {
  const cat = getCategory(t.categorie)
  const showCategory = t.note && t.type === 'depense'
  const meta = [dateLabel, showCategory ? cat.label : null, accountName].filter(Boolean).join(' · ')
  return (
    <li>
      <button type="button" className="tx-row" onClick={() => onSelect?.(t)}>
        <span className={`tx-icon ${t.type}`} aria-hidden="true">
          {cat.emoji}
        </span>
        <span className="tx-main">
          <span className="tx-title">
            {t.note || cat.label}
            {t.recurringId && (
              <span className="badge" title="Généré par un récurrent">
                <span aria-hidden="true">↻</span>
                <span className="sr-only">Récurrent</span>
              </span>
            )}
          </span>
          {meta && <span className="tx-meta">{meta}</span>}
        </span>
        <span className={`tx-amount ${t.type}`}>
          {t.type === 'revenu' ? '+' : '−'}
          {formatMoney(t.montant)}
        </span>
      </button>
    </li>
  )
}
