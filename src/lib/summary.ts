import { round2 } from './format'
import type { CategoryId, Recurring, Transaction } from './types'

export interface MonthSummary {
  revenus: number
  revenusAVenir: number
  chargesFixes: number
  chargesFixesAVenir: number
  depensesVariables: number
  resteAVivre: number
  parCategorie: { categorie: CategoryId; total: number }[]
}

export function summarize(
  transactions: Transaction[],
  upcoming: { recurring: Recurring }[],
): MonthSummary {
  let revenus = 0
  let chargesFixes = 0
  let depensesVariables = 0
  const byCat = new Map<CategoryId, number>()

  for (const t of transactions) {
    if (t.type === 'revenu') {
      revenus += t.montant
      continue
    }
    if (t.recurringId) chargesFixes += t.montant
    else depensesVariables += t.montant
    byCat.set(t.categorie, (byCat.get(t.categorie) ?? 0) + t.montant)
  }

  let revenusAVenir = 0
  let chargesFixesAVenir = 0
  for (const { recurring: r } of upcoming) {
    if (r.type === 'revenu') revenusAVenir += r.montant
    else chargesFixesAVenir += r.montant
  }

  const totalRevenus = round2(revenus + revenusAVenir)
  const totalCharges = round2(chargesFixes + chargesFixesAVenir)
  return {
    revenus: totalRevenus,
    revenusAVenir: round2(revenusAVenir),
    chargesFixes: totalCharges,
    chargesFixesAVenir: round2(chargesFixesAVenir),
    depensesVariables: round2(depensesVariables),
    resteAVivre: round2(totalRevenus - totalCharges - depensesVariables),
    parCategorie: [...byCat]
      .map(([categorie, total]) => ({ categorie, total: round2(total) }))
      .sort((a, b) => b.total - a.total),
  }
}
