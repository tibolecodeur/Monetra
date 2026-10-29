/** Mois au format YYYY-MM. */
export type MonthKey = string

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function today(): string {
  return toISODate(new Date())
}

export function monthOf(date: string): MonthKey {
  return date.slice(0, 7)
}

export function currentMonth(): MonthKey {
  return monthOf(today())
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function monthBounds(month: MonthKey): [string, string] {
  return [`${month}-01`, `${month}-${pad(daysInMonth(month))}`]
}

/** Date de l'occurrence d'un jour du mois, ramenée au dernier jour si besoin. */
export function dayInMonth(month: MonthKey, day: number): string {
  return `${month}-${pad(Math.min(day, daysInMonth(month)))}`
}

export function formatMonth(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatShortDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
