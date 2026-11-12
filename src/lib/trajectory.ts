import { daysInMonth, type MonthKey } from './dates'
import { round2 } from './format'
import type { Recurring, Transaction } from './types'

export interface TrajectoryPoint {
  day: number
  /** Dépenses cumulées à la fin de ce jour. */
  spent: number
  /** Vrai pour les jours à venir : valeur estimée. */
  projected: boolean
}

export interface Trajectory {
  days: number
  /** Dernier jour connu (0 pour un mois à venir, `days` pour un mois passé). */
  lastActualDay: number
  points: TrajectoryPoint[]
  /** Revenus du mois (reçus et prévus) : le plafond à ne pas dépasser. */
  ceiling: number
  /** Dépenses estimées au dernier jour du mois. */
  projectedSpent: number
  /** Ce qui restera, estimé, au dernier jour (négatif : dépassement). */
  projectedLeft: number
  /** Dépenses variables par jour, au rythme constaté depuis le début du mois. */
  dailyPace: number
  /** Dépenses variables possibles par jour d'ici la fin du mois sans dépasser les revenus (0 si plus rien). */
  safePace: number
  /** Premier jour où les dépenses estimées dépassent les revenus, s'il existe. */
  overflowDay: number | null
}

/**
 * Trajectoire des dépenses du mois : le réel jusqu'à aujourd'hui, puis une projection qui suppose
 * que l'on garde le même rythme de dépenses variables, plus les prélèvements prévus à leur date.
 * Répond à la question « est-ce que je tiens jusqu'à la fin du mois ? ».
 */
export function computeTrajectory(
  month: MonthKey,
  transactions: Transaction[],
  upcoming: { recurring: Recurring; date: string }[],
  today: string,
): Trajectory {
  const days = daysInMonth(month)
  const thisMonth = today.slice(0, 7)
  const lastActualDay = month < thisMonth ? days : month > thisMonth ? 0 : Number(today.slice(8))

  const spentOn = new Array<number>(days + 1).fill(0)
  let variable = 0
  let income = 0
  for (const t of transactions) {
    if (t.type === 'revenu') {
      income += t.montant
      continue
    }
    const day = Number(t.date.slice(8))
    if (day >= 1 && day <= days) spentOn[day] += t.montant
    if (!t.recurringId) variable += t.montant
  }

  const scheduledOn = new Array<number>(days + 1).fill(0)
  for (const { recurring: r, date } of upcoming) {
    if (r.type === 'revenu') income += r.montant
    else scheduledOn[Number(date.slice(8))] += r.montant
  }

  const dailyPace = lastActualDay > 0 ? variable / lastActualDay : 0
  const points: TrajectoryPoint[] = []
  let cumulative = 0
  let overflowDay: number | null = null
  for (let day = 1; day <= days; day++) {
    const projected = day > lastActualDay
    // Les opérations déjà saisies pour une date à venir comptent aussi.
    cumulative += spentOn[day] + (projected ? dailyPace + scheduledOn[day] : 0)
    points.push({ day, spent: round2(cumulative), projected })
    if (overflowDay === null && income > 0 && cumulative > income) overflowDay = day
  }

  const projectedSpent = round2(cumulative)
  const remainingDays = days - lastActualDay
  const committed = (lastActualDay > 0 ? points[lastActualDay - 1].spent : 0) +
    scheduledOn.reduce((sum, v, day) => (day > lastActualDay ? sum + v : sum), 0) +
    spentOn.reduce((sum, v, day) => (day > lastActualDay ? sum + v : sum), 0)
  const safePace = remainingDays > 0 ? Math.max(0, (income - committed) / remainingDays) : 0
  return {
    days,
    lastActualDay,
    points,
    ceiling: round2(income),
    projectedSpent,
    projectedLeft: round2(income - projectedSpent),
    dailyPace: round2(dailyPace),
    safePace: round2(safePace),
    overflowDay,
  }
}
