const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export function formatMoney(value: number): string {
  return euro.format(value)
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Accepte « 12,50 », « 12.5 », « 1 200 ». Renvoie NaN si invalide. */
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[\s  €]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return NaN
  return round2(Number(cleaned))
}

export function amountToInput(value: number): string {
  return (Number.isInteger(value) ? String(value) : value.toFixed(2)).replace('.', ',')
}

/** « 1 234,56 € » → [« 1 234 », « ,56 € »] : les centimes sont estompés, les euros portent le regard. */
export function splitMoney(text: string): [string, string] {
  const i = text.lastIndexOf(',')
  return i < 0 ? [text, ''] : [text.slice(0, i), text.slice(i)]
}

const euroRound = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

/** Montant arrondi à l'euro, pour une estimation (« ≈ 467 € ») : des centimes y seraient une fausse précision. */
export function formatMoneyRound(value: number): string {
  return euroRound.format(value)
}

/** Montant signé, sans signe pour zéro (« 0,00 € », jamais « −0,00 € »). */
export function formatSigned(value: number, sign: '+' | '−'): string {
  return value === 0 ? formatMoney(0) : `${sign}${formatMoney(value)}`
}
