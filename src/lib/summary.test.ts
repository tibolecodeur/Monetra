import { describe, expect, it } from 'vitest'
import { summarize } from './summary'
import type { Recurring, Transaction } from './types'

const tx = (t: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  date: '2026-10-10',
  montant: 0,
  type: 'depense',
  categorie: 'divers',
  compteId: 'a1',
  note: '',
  ...t,
})

describe('summarize', () => {
  it('sépare charges fixes et dépenses variables et calcule le reste à vivre', () => {
    const s = summarize(
      [
        tx({ type: 'revenu', montant: 1000, categorie: 'revenu', recurringId: 'r' }),
        tx({ montant: 400, categorie: 'logement', recurringId: 'r2' }),
        tx({ montant: 50.1, categorie: 'courses' }),
        tx({ montant: 20.2, categorie: 'courses' }),
      ],
      [{ recurring: { montant: 10, type: 'depense' } as Recurring }],
    )
    expect(s.revenus).toBe(1000)
    expect(s.chargesFixes).toBe(410)
    expect(s.chargesFixesAVenir).toBe(10)
    expect(s.depensesVariables).toBe(70.3)
    expect(s.resteAVivre).toBe(519.7)
    expect(s.parCategorie[0]).toEqual({ categorie: 'logement', total: 400 })
  })
})
