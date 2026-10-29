import { describe, expect, it } from 'vitest'
import { parseBackup } from './backup'

const valid = {
  app: 'monetra',
  version: 1,
  exportedAt: '2026-10-29T10:00:00.000Z',
  data: {
    accounts: [{ id: 'a1', nom: 'Courant', type: 'courant', banque: '', solde: 10 }],
    transactions: [],
    recurring: [],
    budgets: [],
  },
}

describe('parseBackup', () => {
  it('accepte une sauvegarde valide et complète les sections absentes', () => {
    const b = parseBackup(JSON.stringify(valid))
    expect(b.data.accounts).toHaveLength(1)
    expect(b.data.goals).toEqual([])
  })

  it('rejette un fichier qui n’est pas une sauvegarde Monetra', () => {
    expect(() => parseBackup('pas du json')).toThrow('JSON valide')
    expect(() => parseBackup('{"foo":1}')).toThrow('sauvegarde Monetra')
  })

  it('rejette un élément invalide', () => {
    const bad = { ...valid, data: { ...valid.data, transactions: [{ id: 't1' }] } }
    expect(() => parseBackup(JSON.stringify(bad))).toThrow('transactions')
  })
})
