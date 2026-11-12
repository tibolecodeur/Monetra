import { describe, expect, it } from 'vitest'
import { formatDayHeading, formatShortDay, relativeDay } from './dates'

describe('dates relatives', () => {
  it('dit aujourd’hui, hier et demain, y compris à cheval sur deux mois', () => {
    expect(relativeDay('2026-11-01', '2026-11-01')).toBe("Aujourd'hui")
    expect(relativeDay('2026-10-31', '2026-11-01')).toBe('Hier')
    expect(relativeDay('2026-11-02', '2026-11-01')).toBe('Demain')
    expect(relativeDay('2026-10-30', '2026-11-01')).toBeNull()
  })

  it('retombe sur la date complète ou courte au-delà', () => {
    expect(formatDayHeading('2026-10-28', '2026-10-29')).toBe('Hier')
    expect(formatDayHeading('2026-10-21', '2026-10-29')).toBe('Mercredi 21 octobre')
    expect(formatShortDay('2026-10-21', '2026-10-29')).toBe('21 oct.')
  })
})
