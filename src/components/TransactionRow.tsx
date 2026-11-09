import { Repeat } from 'lucide-react'
import { motion } from 'motion/react'
import { getCategory } from '../lib/categories'
import { formatMoney } from '../lib/format'
import type { Transaction } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'
import { SwipeRow } from './SwipeRow'

interface Props {
  transaction: Transaction
  accountName?: string
  onSelect?: (t: Transaction) => void
  /** Active le glissement vers la gauche pour supprimer. */
  onSwipeDelete?: (t: Transaction) => void
  dateLabel?: string
}

export function TransactionRow({ transaction: t, accountName, onSelect, onSwipeDelete, dateLabel }: Props) {
  const cat = getCategory(t.categorie)
  const showCategory = t.note && t.type === 'depense'
  const meta = [dateLabel, showCategory ? cat.label : null, accountName].filter(Boolean).join(' · ')
  const sign = t.type === 'revenu' ? '+' : '−'
  const title = t.note || cat.label

  const row = (
    <button type="button" className="row" onClick={() => onSelect?.(t)}>
      <span className={`row-icon ${t.type} cat-${t.categorie}`}>
        <CategoryIcon categorie={t.categorie} />
      </span>
      <span className="row-main">
        <span className="row-title">{title}</span>
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
  )

  if (!onSwipeDelete) return <li>{row}</li>

  return (
    <motion.li layout="position" exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.15 } }}>
      <SwipeRow label={`Supprimer ${title}`} onDelete={() => onSwipeDelete(t)}>
        {row}
      </SwipeRow>
    </motion.li>
  )
}
