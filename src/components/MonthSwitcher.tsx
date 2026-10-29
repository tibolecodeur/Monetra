import { addMonths, currentMonth, formatMonth, type MonthKey } from '../lib/dates'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

interface Props {
  month: MonthKey
  onChange: (month: MonthKey) => void
}

export function MonthSwitcher({ month, onChange }: Props) {
  const isCurrent = month === currentMonth()
  return (
    <div className="month-switcher">
      <button type="button" className="icon-button" onClick={() => onChange(addMonths(month, -1))} aria-label="Mois précédent">
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        className="month-label"
        onClick={() => onChange(currentMonth())}
        disabled={isCurrent}
        title={isCurrent ? undefined : 'Revenir au mois en cours'}
      >
        {formatMonth(month)}
      </button>
      <button type="button" className="icon-button" onClick={() => onChange(addMonths(month, 1))} aria-label="Mois suivant">
        <ChevronRightIcon />
      </button>
    </div>
  )
}
