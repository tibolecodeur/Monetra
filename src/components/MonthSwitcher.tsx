import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, currentMonth, formatMonth, type MonthKey } from '../lib/dates'
import { Glass } from './Glass'

interface Props {
  month: MonthKey
  onChange: (month: MonthKey) => void
}

export function MonthSwitcher({ month, onChange }: Props) {
  const isCurrent = month === currentMonth()
  return (
    <Glass className="month-switcher" height={50} radius={25}>
    <div className="month-switcher-inner" role="group" aria-label="Mois affiché">
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(addMonths(month, -1))}
        aria-label="Mois précédent"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="month-label"
        onClick={() => onChange(currentMonth())}
        aria-disabled={isCurrent}
        aria-label={isCurrent ? `${formatMonth(month)}, mois en cours` : `${formatMonth(month)}, revenir au mois en cours`}
      >
        {formatMonth(month)}
      </button>
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="Mois suivant"
      >
        <ChevronRight size={22} aria-hidden="true" />
      </button>
    </div>
    </Glass>
  )
}
