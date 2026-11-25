// CSV export of the expenses (v3 §7.10), for Excel or Sheets in French:
// « ; » separator, decimal comma, UTF-8 with BOM.
import type { BudjData, Expense } from '../shared/types'
import { PAYMENT_LABELS } from './format'

const BOM = '﻿'
const HEADER = ['date', 'libellé', 'catégorie', 'montant', 'moyen']

/** Quotes a cell when it holds the separator, a quote or a line break. */
function cell(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

/** 2478 → "24,78"; −500 → "-5,00". */
export function centsToCsv(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`
}

/** Expenses from `from` (YYYY-MM-DD, inclusive) on, oldest first. */
export function expensesToCsv(data: BudjData, from?: string): string {
  const names = new Map(data.categories.map((c) => [c.id, c.name]))
  const rows = data.expenses
    .filter((e) => from === undefined || e.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e: Expense) =>
      [
        e.date,
        e.label,
        e.categoryId ? (names.get(e.categoryId) ?? 'Sans catégorie') : 'Sans catégorie',
        centsToCsv(e.amount),
        e.paymentMethod ? PAYMENT_LABELS[e.paymentMethod] : ''
      ]
        .map(cell)
        .join(';')
    )
  return BOM + [HEADER.join(';'), ...rows].join('\r\n') + '\r\n'
}
