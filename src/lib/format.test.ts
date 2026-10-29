import { describe, expect, it } from 'vitest'
import { parseAmount } from './format'

describe('parseAmount', () => {
  it('accepte virgule, point et espaces', () => {
    expect(parseAmount('12,5')).toBe(12.5)
    expect(parseAmount('1 200.40')).toBe(1200.4)
    expect(parseAmount('8 €')).toBe(8)
  })

  it('refuse les saisies invalides', () => {
    expect(parseAmount('')).toBeNaN()
    expect(parseAmount('abc')).toBeNaN()
    expect(parseAmount('1,234')).toBeNaN()
  })
})
