import { describe, expect, it } from 'vitest'
import { computeTrajectory } from './trajectory'
import type { Recurring, Transaction } from './types'

const tx = (date: string, montant: number, extra: Partial<Transaction> = {}): Transaction => ({
  id: date + montant,
  date,
  montant,
  type: 'depense',
  categorie: 'courses',
  compteId: 'c',
  note: '',
  ...extra,
})

const rec = (jourDuMois: number, montant: number, type: Recurring['type'] = 'depense'): Recurring => ({
  id: `r${jourDuMois}`,
  libelle: 'r',
  montant,
  type,
  jourDuMois,
  categorie: 'logement',
  compteId: 'c',
  dateDebut: '2026-01-01',
})

describe('computeTrajectory', () => {
  it('projette le rythme des dépenses variables et les prélèvements prévus', () => {
    // 10 jours écoulés, 100 € de variables (10 €/jour), un loyer de 500 € déjà passé (récurrent).
    const transactions = [
      tx('2026-11-01', 1500, { type: 'revenu', categorie: 'revenu' }),
      tx('2026-11-03', 500, { recurringId: 'loyer', categorie: 'logement' }),
      tx('2026-11-04', 60),
      tx('2026-11-09', 40),
    ]
    const upcoming = [{ recurring: rec(20, 30), date: '2026-11-20' }]
    const t = computeTrajectory('2026-11', transactions, upcoming, '2026-11-10')

    expect(t.days).toBe(30)
    expect(t.lastActualDay).toBe(10)
    expect(t.dailyPace).toBe(10)
    expect(t.points[9]).toEqual({ day: 10, spent: 600, projected: false })
    expect(t.points[10].projected).toBe(true)
    // 600 réels + 20 jours × 10 € + 30 € prévus le 20.
    expect(t.projectedSpent).toBe(830)
    expect(t.ceiling).toBe(1500)
    expect(t.projectedLeft).toBe(670)
    expect(t.overflowDay).toBeNull()
    // (1500 − 600 − 30) / 20 jours restants.
    expect(t.safePace).toBe(43.5)
  })

  it('signale le jour du dépassement', () => {
    const transactions = [tx('2026-11-01', 300, { type: 'revenu', categorie: 'revenu' }), tx('2026-11-02', 40)]
    const t = computeTrajectory('2026-11', transactions, [], '2026-11-02')
    // 20 €/jour : 300 € dépassés le 16.
    expect(t.overflowDay).toBe(16)
    expect(t.projectedLeft).toBeLessThan(0)
    // (300 − 40) / 28 jours.
    expect(t.safePace).toBe(9.29)
  })

  it('n’estime rien pour un mois passé, et compte les revenus prévus dans le plafond', () => {
    const past = computeTrajectory('2026-10', [tx('2026-10-05', 25)], [], '2026-11-10')
    expect(past.lastActualDay).toBe(31)
    expect(past.points.every((p) => !p.projected)).toBe(true)
    expect(past.projectedSpent).toBe(25)

    const next = computeTrajectory('2026-12', [], [{ recurring: rec(5, 1200, 'revenu'), date: '2026-12-05' }], '2026-11-10')
    expect(next.lastActualDay).toBe(0)
    expect(next.ceiling).toBe(1200)
    expect(next.projectedSpent).toBe(0)
  })
})
