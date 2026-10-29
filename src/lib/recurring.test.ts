import { describe, expect, it, vi } from 'vitest'
import { dueOccurrences, upcomingOccurrences } from './recurring'
import type { Recurring } from './types'

const base: Recurring = {
  id: 'r1',
  libelle: 'Loyer',
  montant: 400,
  type: 'depense',
  jourDuMois: 5,
  categorie: 'logement',
  compteId: 'a1',
  dateDebut: '2026-08-01',
}

describe('dueOccurrences', () => {
  it('génère chaque mois échu depuis le début', () => {
    expect(dueOccurrences(base, '2026-10-29').map((o) => o.date)).toEqual(['2026-08-05', '2026-09-05', '2026-10-05'])
  })

  it("ne génère pas l'occurrence du mois avant son jour", () => {
    expect(dueOccurrences(base, '2026-10-04').map((o) => o.date)).toEqual(['2026-08-05', '2026-09-05'])
  })

  it('reprend après la dernière génération', () => {
    expect(dueOccurrences({ ...base, derniereGeneration: '2026-09' }, '2026-10-29').map((o) => o.month)).toEqual([
      '2026-10',
    ])
    expect(dueOccurrences({ ...base, derniereGeneration: '2026-10' }, '2026-10-29')).toEqual([])
  })

  it('respecte la date de fin', () => {
    expect(dueOccurrences({ ...base, dateFin: '2026-09-30' }, '2026-12-01').map((o) => o.date)).toEqual([
      '2026-08-05',
      '2026-09-05',
    ])
  })

  it('ramène le jour au dernier jour du mois', () => {
    const r = { ...base, jourDuMois: 31, dateDebut: '2027-02-01' }
    expect(dueOccurrences(r, '2027-03-01').map((o) => o.date)).toEqual(['2027-02-28'])
  })
})

describe('upcomingOccurrences', () => {
  it('liste les occurrences restantes du mois en cours', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 10) })
    const salaire: Recurring = { ...base, id: 'r2', type: 'revenu', jourDuMois: 28, derniereGeneration: '2026-09' }
    const loyer: Recurring = { ...base, derniereGeneration: '2026-10' }
    expect(upcomingOccurrences([salaire, loyer], '2026-10', '2026-10-10')).toEqual([
      { recurring: salaire, date: '2026-10-28' },
    ])
    expect(upcomingOccurrences([salaire], '2026-09', '2026-10-10')).toEqual([])
    vi.useRealTimers()
  })
})
