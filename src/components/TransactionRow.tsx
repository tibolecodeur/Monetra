import { Repeat } from 'lucide-react'
import { getCategory } from '../lib/categories'
import { formatMoney } from '../lib/format'
import type { Transaction } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'

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
  const sign = t.type === 'revenu' ? '+' : '−'
  return (
    <li>
      <button type="button" className="row" onClick={() => onSelect?.(t)}>
        <span className={`row-icon ${t.type}`}>
          <CategoryIcon categorie={t.categorie} />
        </span>
        <span className="row-main">
          <span className="row-title">{t.note || cat.label}</span>
          {(meta || t.recurringId) && (
            <span className="row-meta">
              {t.recurringId && (
                <span className="row-tag">
                  <Repeat size={12} strokeWidth={2.5} aria-hidden="true" />
                  Auto
                </span>
              )}
              {meta}
            </span>
          )}
        </span>
        <span className={`amount ${t.type}`}>
          {sign}
          {formatMoney(t.montant)}
        </span>
      </button>
    </li>
  )
}
