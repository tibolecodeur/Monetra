/** Mois au format YYYY-MM. */
export type MonthKey = string

const pad = (n: number) => String(n).padStart(2, '0')

function toISODate(d: Date): string {
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

/** « Aujourd'hui », « Hier », « Demain », ou null : comme les listes d'iOS, le proche se dit en mots. */
export function relativeDay(date: string, now = today()): string | null {
  const offset = (delta: number) => addDays(now, delta)
  if (date === now) return "Aujourd'hui"
  if (date === offset(-1)) return 'Hier'
  if (date === offset(1)) return 'Demain'
  return null
}

/** En-tête de jour : relatif si proche, sinon « Mercredi 28 octobre ». */
export function formatDayHeading(date: string, now = today()): string {
  return relativeDay(date, now) ?? formatDay(date)
}

/** Date courte : relative si proche, sinon « 28 oct. ». */
export function formatShortDay(date: string, now = today()): string {
  return relativeDay(date, now) ?? formatShortDate(date)
}

/** Décale une date YYYY-MM-DD d'un nombre de jours. */
export function addDays(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return toISODate(new Date(y, m - 1, d + delta))
}
