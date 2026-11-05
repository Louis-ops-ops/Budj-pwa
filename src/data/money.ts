// Money helpers. Amounts are integer cents; formatting happens at display time only.

const MINUS = '−'

const withDecimals = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const noDecimals = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})
const plainNumber = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

const typographicMinus = (s: string): string => s.replace('-', MINUS)

/** "24,78 €" */
export function formatEuro(cents: number): string {
  return typographicMinus(withDecimals.format(cents / 100))
}

/** "400 €" for round amounts, "24,78 €" otherwise. */
export function formatEuroShort(cents: number): string {
  return cents % 100 === 0 ? typographicMinus(noDecimals.format(cents / 100)) : formatEuro(cents)
}

/** "123 €", rounded down to whole euros. */
export function formatEuroFloor(cents: number): string {
  return typographicMinus(noDecimals.format(Math.floor(cents / 100)))
}

/** "+25 €" / "−25 €" / "0 €" */
export function formatEuroSigned(cents: number): string {
  const sign = cents > 0 ? '+' : cents < 0 ? MINUS : ''
  return sign + formatEuroShort(Math.abs(cents))
}

/** "1 900" (no currency), used next to an amount input. */
export function formatNumber(units: number): string {
  return plainNumber.format(units)
}

/**
 * Parses a typed or pasted amount ("24,78", "24.78", "24,78 €", "1 900")
 * into cents without going through floats. Returns null if invalid.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[\s\u00a0\u202f\u20ac]/g, '').replace('.', ',')
  const match = /^(\d+)(?:,(\d{0,2}))?$/.exec(cleaned)
  if (!match) return null
  const units = Number(match[1])
  const decimals = (match[2] ?? '').padEnd(2, '0')
  const cents = units * 100 + Number(decimals)
  return Number.isSafeInteger(cents) ? cents : null
}

/** Inverse of parseAmount for pre-filled inputs: 2478 → "24,78", 40000 → "400". */
export function centsToInput(cents: number): string {
  const units = Math.floor(cents / 100)
  const rest = cents % 100
  return rest === 0 ? String(units) : `${units},${String(rest).padStart(2, '0')}`
}

/** Rounded percentage for display ("103 %"). */
export function percent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`
}

/** Keeps digits and a single decimal separator (comma or dot → comma), 2 decimals max. */
export function sanitizeAmountText(raw: string): string {
  const normalized = raw.replace(/\./g, ',').replace(/[^\d,]/g, '')
  const [units, ...rest] = normalized.split(',')
  const trimmedUnits = units.replace(/^0+(?=\d)/, '').slice(0, 7)
  if (rest.length === 0) return trimmedUnits
  return `${trimmedUnits || '0'},${rest.join('').slice(0, 2)}`
}

export function amountTextToCents(text: string): number {
  return parseAmount(text) ?? 0
}
