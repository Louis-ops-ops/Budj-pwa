// Display helpers shared by several screens and dialogs.
import { CATEGORY_COLORS, type CategoryColor, type PaymentMethod } from '../shared/types'
import { daysBetween, formatShortDay, todayISO } from './dates'

export function initialOf(label: string): string {
  return label.trim().charAt(0).toUpperCase() || '?'
}

export const PAYMENT_LABELS: Record<PaymentMethod | 'none', string> = {
  none: 'Non précisé',
  card: 'Carte bancaire',
  applePay: 'Apple Pay',
  cash: 'Espèces',
  transfer: 'Virement',
  other: 'Autre'
}

export function formatExpenseDate(day: string, today = todayISO()): string {
  const diff = daysBetween(day, today)
  if (diff === 0) return 'Aujourd’hui'
  if (diff === 1) return 'Hier'
  return formatShortDay(day)
}

export function firstFreeColor(used: CategoryColor[]): CategoryColor {
  return (
    CATEGORY_COLORS.find((c) => !used.includes(c)) ??
    CATEGORY_COLORS[used.length % CATEGORY_COLORS.length]
  )
}
