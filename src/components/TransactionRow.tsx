import { CopyPlus, Pencil, Repeat, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { getCategory } from '../lib/categories'
import { useContextMenu } from '../lib/contextMenu'
import { today } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { deleteTransaction, duplicateTransaction, restoreTransaction } from '../lib/mutations'
import { useToast } from '../lib/toast'
import { useLongPress } from '../lib/useLongPress'
import type { Transaction } from '../lib/types'
import { Money } from './AnimatedAmount'
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
  const toast = useToast()
  const openMenu = useContextMenu()

  // Suppression annulable depuis le toast ; même chemin pour le swipe et le menu contextuel.
  const remove = () => {
    if (onSwipeDelete) return onSwipeDelete(t)
    void deleteTransaction(t.id)
    toast({ message: 'Transaction supprimée', action: { label: 'Annuler', onAction: () => void restoreTransaction(t) } })
  }
  const duplicate = async () => {
    const id = await duplicateTransaction(t, today())
    toast({
      message: `Opération dupliquée : ${formatMoney(t.montant)} aujourd'hui`,
      action: { label: 'Annuler', onAction: () => void deleteTransaction(id) },
    })
  }

  // Appui long : menu contextuel (Modifier, Dupliquer, Supprimer), comme les listes d'iOS.
  const longPress = useLongPress<HTMLButtonElement>((anchor) =>
    openMenu({
      anchor,
      label: title,
      items: [
        ...(onSelect ? [{ label: 'Modifier', icon: Pencil, onSelect: () => onSelect(t) }] : []),
        { label: 'Dupliquer aujourd’hui', icon: CopyPlus, onSelect: () => void duplicate() },
        { label: 'Supprimer', icon: Trash2, onSelect: remove, destructive: true },
      ],
    }),
  )

  const row = (
    <button type="button" className="row" onClick={() => onSelect?.(t)} {...longPress}>
      <span className={`row-icon tint-${t.categorie}`}>
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
        <Money value={t.montant} sign={sign} />
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
