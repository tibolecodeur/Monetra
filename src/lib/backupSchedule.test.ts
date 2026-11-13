import { describe, expect, it } from 'vitest'
import { daysSince, describeLastBackup, isBackupDue, isStale, needsDailySnapshot, snapshotsToPrune } from './backupSchedule'

const at = (s: string) => new Date(s)

describe('sauvegarde du jour', () => {
  it('n’est proposée qu’après l’heure choisie, une fois par jour', () => {
    expect(isBackupDue(at('2026-11-13T20:59:00'), '21:00', null, null)).toBe(false)
    expect(isBackupDue(at('2026-11-13T21:00:00'), '21:00', null, null)).toBe(true)
    // Déjà sauvegardé aujourd'hui (même avant l'heure) : plus de rappel.
    expect(isBackupDue(at('2026-11-13T22:00:00'), '21:00', at('2026-11-13T08:00:00').toISOString(), null)).toBe(false)
    // Sauvegardé hier : de nouveau dû ce soir.
    expect(isBackupDue(at('2026-11-13T21:30:00'), '21:00', at('2026-11-12T21:05:00').toISOString(), null)).toBe(true)
  })

  it('se reporte à demain, et accepte une heure invalide (21 h par défaut)', () => {
    expect(isBackupDue(at('2026-11-13T22:00:00'), '21:00', null, '2026-11-13')).toBe(false)
    expect(isBackupDue(at('2026-11-14T22:00:00'), '21:00', null, '2026-11-13')).toBe(true)
    expect(isBackupDue(at('2026-11-13T20:00:00'), 'n’importe quoi', null, null)).toBe(false)
    expect(isBackupDue(at('2026-11-13T07:30:00'), '7:15', null, null)).toBe(true)
  })

  it('compte les jours et passe en alerte au-delà de 3 jours', () => {
    const now = at('2026-11-13T10:00:00')
    expect(daysSince(null, now)).toBeNull()
    expect(daysSince(at('2026-11-12T23:30:00').toISOString(), now)).toBe(1)
    expect(isStale(null, now)).toBe(true)
    expect(isStale(at('2026-11-10T09:00:00').toISOString(), now)).toBe(false)
    expect(isStale(at('2026-11-09T09:00:00').toISOString(), now)).toBe(true)
    expect(describeLastBackup(at('2026-11-13T09:04:00').toISOString(), now)).toBe("aujourd'hui à 9 h 04")
    expect(describeLastBackup(at('2026-11-08T09:04:00').toISOString(), now)).toBe('il y a 5 jours')
    expect(describeLastBackup(null, now)).toBe('jamais')
  })
})

describe('copies de sécurité', () => {
  it('une copie automatique par jour', () => {
    const now = at('2026-11-13T10:00:00')
    expect(needsDailySnapshot([], now)).toBe(true)
    expect(needsDailySnapshot([{ createdAt: at('2026-11-13T08:00:00').toISOString(), reason: 'import' }], now)).toBe(true)
    expect(needsDailySnapshot([{ createdAt: at('2026-11-13T08:00:00').toISOString(), reason: 'auto' }], now)).toBe(false)
  })

  it('garde les 7 plus récentes', () => {
    const list = Array.from({ length: 9 }, (_, i) => ({ id: `s${i}`, createdAt: `2026-11-0${i + 1}T10:00:00.000Z` }))
    expect(snapshotsToPrune(list).sort()).toEqual(['s0', 's1'])
    expect(snapshotsToPrune(list.slice(0, 3))).toEqual([])
  })
})
