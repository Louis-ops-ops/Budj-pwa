// Pure calculations (CLAUDE.md §7.2). No React here: screens never add numbers themselves.
import type { BudjData, Category, Expense, FixedExpense } from '../shared/types'
import { addMonths, dayNumber, daysInMonth, makeDay, monthOf, monthRange } from './dates'

const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0)

// ---------- Budget and fixed expenses ----------

/**
 * Budget of a month: the last period starting on or before it.
 * Months before the first period use the first known budget.
 */
export function monthBudget(data: BudjData, month: string): number {
  const history = data.budgetHistory
  if (history.length === 0) return 0
  let amount = history[0].amount
  for (const period of history) {
    if (period.fromMonth <= month) amount = period.amount
    else break
  }
  return amount
}

export function isFixedActive(fixed: FixedExpense, month: string): boolean {
  return fixed.startMonth <= month && (fixed.endMonth === undefined || fixed.endMonth >= month)
}

export function activeFixed(data: BudjData, month: string): FixedExpense[] {
  return data.fixedExpenses.filter((f) => isFixedActive(f, month))
}

/** Day the fixed expense is charged in this month (31 → last day of shorter months). */
export function chargeDay(fixed: FixedExpense, month: string): number {
  return Math.min(fixed.dayOfMonth, daysInMonth(month))
}

export function fixedTotal(data: BudjData, month: string): number {
  return sum(activeFixed(data, month).map((f) => f.amount))
}

/** Fixed expenses already charged: all for a past month, none for a future one. */
export function paidFixed(data: BudjData, month: string, today: string): FixedExpense[] {
  const current = monthOf(today)
  if (month < current) return activeFixed(data, month)
  if (month > current) return []
  const day = dayNumber(today)
  return activeFixed(data, month).filter((f) => chargeDay(f, month) <= day)
}

export function paidFixedTotal(data: BudjData, month: string, today: string): number {
  return sum(paidFixed(data, month, today).map((f) => f.amount))
}

export function annualCost(fixed: Pick<FixedExpense, 'amount'>): number {
  return fixed.amount * 12
}

// ---------- Variable spending ----------

export function expensesOfMonth(data: BudjData, month: string): Expense[] {
  return data.expenses.filter((e) => monthOf(e.date) === month)
}

export function variableSpent(data: BudjData, month: string): number {
  return sum(expensesOfMonth(data, month).map((e) => e.amount))
}

export function categorySpent(data: BudjData, month: string, categoryId: string | null): number {
  return sum(
    expensesOfMonth(data, month)
      .filter((e) => e.categoryId === categoryId)
      .map((e) => e.amount)
  )
}

export function uncategorizedCount(data: BudjData, month: string): number {
  return expensesOfMonth(data, month).filter((e) => e.categoryId === null).length
}

// ---------- Home ----------

export function globalRemaining(data: BudjData, month: string): number {
  return monthBudget(data, month) - fixedTotal(data, month) - variableSpent(data, month)
}

export interface BudgetGauge {
  budget: number
  fixed: number
  spent: number
  remaining: number
  /** Value that the segments are proportional to (≥ budget when overspent). */
  scale: number
}

export function budgetGauge(data: BudjData, month: string): BudgetGauge {
  const budget = monthBudget(data, month)
  const fixed = fixedTotal(data, month)
  const spent = variableSpent(data, month)
  const remaining = Math.max(0, budget - fixed - spent)
  return { budget, fixed, spent, remaining, scale: Math.max(budget, fixed + spent) }
}

/** Remaining per day until the end of the month, today included. Null if not relevant. */
export function dailyPace(data: BudjData, month: string, today: string): number | null {
  if (month !== monthOf(today)) return null
  const remaining = globalRemaining(data, month)
  if (remaining <= 0) return null
  const daysLeft = daysInMonth(month) - dayNumber(today) + 1
  return Math.floor(remaining / daysLeft)
}

export interface CategoryStatus {
  category: Category
  budget: number
  spent: number
  remaining: number
  ratio: number
  over: boolean
}

export function categoryStatus(data: BudjData, month: string, category: Category): CategoryStatus {
  const spent = categorySpent(data, month, category.id)
  const budget = category.monthlyBudget
  const remaining = budget - spent
  const ratio = budget > 0 ? spent / budget : spent > 0 ? Infinity : 0
  return { category, budget, spent, remaining, ratio, over: remaining < 0 }
}

export function categoryStatuses(data: BudjData, month: string): CategoryStatus[] {
  return data.categories.map((c) => categoryStatus(data, month, c))
}

export interface FixedStatus {
  count: number
  total: number
  paid: number
  upcoming: number
  ratio: number
}

export function fixedStatus(data: BudjData, month: string, today: string): FixedStatus {
  const total = fixedTotal(data, month)
  const paid = paidFixedTotal(data, month, today)
  return {
    count: activeFixed(data, month).length,
    total,
    paid,
    upcoming: total - paid,
    ratio: total > 0 ? paid / total : 0
  }
}

export function allocatedBudget(data: BudjData, month: string): number {
  return sum(data.categories.map((c) => c.monthlyBudget)) + fixedTotal(data, month)
}

export function toAllocate(data: BudjData, month: string): number {
  return monthBudget(data, month) - allocatedBudget(data, month)
}

export interface UpcomingCharge {
  fixed: FixedExpense
  date: string
  nextMonth: boolean
}

/** Not-yet-charged fixed expenses this month, then the start of next month (max 4). */
export function upcomingCharges(data: BudjData, today: string, limit = 4): UpcomingCharge[] {
  const month = monthOf(today)
  const day = dayNumber(today)
  const byDay = (m: string) => (a: FixedExpense, b: FixedExpense) =>
    chargeDay(a, m) - chargeDay(b, m)

  const current = activeFixed(data, month)
    .filter((f) => chargeDay(f, month) > day)
    .sort(byDay(month))
    .map((fixed) => ({ fixed, date: makeDay(month, chargeDay(fixed, month)), nextMonth: false }))

  const next = addMonths(month, 1)
  const following = activeFixed(data, next)
    .sort(byDay(next))
    .map((fixed) => ({ fixed, date: makeDay(next, chargeDay(fixed, next)), nextMonth: true }))

  return [...current, ...following].slice(0, limit)
}

// ---------- Add-expense impact ----------

export interface Impact {
  budget: number
  spentBefore: number
  remainingAfter: number
  over: boolean
}

export function expenseImpact(
  data: BudjData,
  month: string,
  categoryId: string,
  amount: number,
  /** Expense being edited: its current amount is not counted twice. */
  excludeExpenseId?: string
): Impact | null {
  const category = data.categories.find((c) => c.id === categoryId)
  if (!category) return null
  const spentBefore = sum(
    expensesOfMonth(data, month)
      .filter((e) => e.categoryId === categoryId && e.id !== excludeExpenseId)
      .map((e) => e.amount)
  )
  const remainingAfter = category.monthlyBudget - spentBefore - amount
  return { budget: category.monthlyBudget, spentBefore, remainingAfter, over: remainingAfter < 0 }
}

// ---------- Evolution ----------

export function savings(data: BudjData, month: string): number {
  return globalRemaining(data, month)
}

/** First month with any data (budget, fixed expense or expense). */
export function firstDataMonth(data: BudjData, today: string): string {
  const candidates = [
    ...data.budgetHistory.map((p) => p.fromMonth),
    ...data.fixedExpenses.map((f) => f.startMonth),
    ...data.expenses.map((e) => monthOf(e.date))
  ]
  const current = monthOf(today)
  return candidates.reduce((min, m) => (m < min ? m : min), current)
}

/** Months from the first data month to the current one (for month pickers). */
export function availableMonths(data: BudjData, today: string): string[] {
  return monthRange(firstDataMonth(data, today), monthOf(today))
}

export interface CategoryComparison {
  category: Category
  spent: number
  previous: number
  delta: number
  tone: 'positive' | 'negative' | 'neutral'
}

export function compareWithPreviousMonth(data: BudjData, month: string): CategoryComparison[] {
  const prev = addMonths(month, -1)
  return data.categories.map((category) => {
    const spent = categorySpent(data, month, category.id)
    const previous = categorySpent(data, prev, category.id)
    const delta = spent - previous
    const tone = delta < 0 ? 'positive' : delta > 0 ? 'negative' : 'neutral'
    return { category, spent, previous, delta, tone }
  })
}

export interface YearSummary {
  months: number
  total: number
  average: number
  best: { month: string; savings: number } | null
  inTheGreen: number
}

/** Summary over the last 12 completed months, starting at the first data month. */
export function yearSummary(data: BudjData, today: string): YearSummary {
  const lastDone = addMonths(monthOf(today), -1)
  const from = [firstDataMonth(data, today), addMonths(lastDone, -11)].sort()[1]
  const months = from <= lastDone ? monthRange(from, lastDone) : []
  const values = months.map((month) => ({ month, savings: savings(data, month) }))
  const total = sum(values.map((v) => v.savings))
  const best = values.reduce<YearSummary['best']>(
    (acc, v) => (acc === null || v.savings > acc.savings ? v : acc),
    null
  )
  return {
    months: values.length,
    total,
    average: values.length ? Math.round(total / values.length) : 0,
    best,
    inTheGreen: values.filter((v) => v.savings >= 0).length
  }
}

// ---------- Fixed calendar ----------

/** Active fixed expenses grouped by charge day for a month. */
export function fixedByDay(data: BudjData, month: string): Map<number, FixedExpense[]> {
  const map = new Map<number, FixedExpense[]>()
  for (const f of activeFixed(data, month)) {
    const day = chargeDay(f, month)
    map.set(day, [...(map.get(day) ?? []), f])
  }
  return map
}

// ---------- Category detail ----------

/** Category remaining per day until the end of the month, today included. */
export function categoryDailyPace(
  data: BudjData,
  month: string,
  today: string,
  category: Category
): number | null {
  if (month !== monthOf(today)) return null
  const remaining = category.monthlyBudget - categorySpent(data, month, category.id)
  if (remaining <= 0) return null
  return Math.floor(remaining / (daysInMonth(month) - dayNumber(today) + 1))
}

/** Expenses of a category for a month, most recent first. */
export function categoryExpenses(
  data: BudjData,
  month: string,
  categoryId: string | null
): Expense[] {
  return expensesOfMonth(data, month)
    .filter((e) => e.categoryId === categoryId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export interface ExpenseStats {
  count: number
  average: number
  largest: number
}

export function expenseStats(expenses: Expense[]): ExpenseStats {
  const total = sum(expenses.map((e) => e.amount))
  return {
    count: expenses.length,
    average: expenses.length ? Math.round(total / expenses.length) : 0,
    largest: expenses.reduce((max, e) => Math.max(max, e.amount), 0)
  }
}

export interface CategoryMonth {
  month: string
  spent: number
  over: boolean
}

/** Spending of a category over the last `count` months up to `month`, from the first data month. */
export function categoryHistory(
  data: BudjData,
  category: Category,
  month: string,
  today: string,
  count = 6
): CategoryMonth[] {
  const from = [firstDataMonth(data, today), addMonths(month, -(count - 1))].sort()[1]
  return monthRange(from, month).map((m) => {
    const spent = categorySpent(data, m, category.id)
    return { month: m, spent, over: spent > category.monthlyBudget }
  })
}

// ---------- Fixed expenses screen ----------

export interface FixedGroup {
  subcategory: { id: string; name: string }
  total: number
  items: FixedExpense[]
}

/** Active fixed expenses of a month grouped by subcategory (subcategory order), sorted by day. */
export function fixedGroups(data: BudjData, month: string): FixedGroup[] {
  const active = activeFixed(data, month)
  const known = new Set(data.fixedSubcategories.map((s) => s.id))
  const subs = [
    ...data.fixedSubcategories,
    ...(active.some((f) => !known.has(f.subcategoryId)) ? [{ id: '', name: 'Autres' }] : [])
  ]
  return subs
    .map((subcategory) => {
      const items = active
        .filter((f) =>
          subcategory.id === '' ? !known.has(f.subcategoryId) : f.subcategoryId === subcategory.id
        )
        .sort((a, b) => chargeDay(a, month) - chargeDay(b, month) || a.label.localeCompare(b.label))
      return { subcategory, total: sum(items.map((f) => f.amount)), items }
    })
    .filter((g) => g.items.length > 0)
}

export function isFixedPaid(fixed: FixedExpense, month: string, today: string): boolean {
  const current = monthOf(today)
  if (month < current) return true
  if (month > current) return false
  return chargeDay(fixed, month) <= dayNumber(today)
}

/** Default selected day of the calendar: next charge day, else the first one, else today (or the 1st). */
export function defaultCalendarDay(data: BudjData, month: string, today: string): number {
  const days = [...fixedByDay(data, month).keys()].sort((a, b) => a - b)
  const isCurrent = month === monthOf(today)
  if (isCurrent) {
    const next = days.find((d) => d >= dayNumber(today))
    return next ?? dayNumber(today)
  }
  return days[0] ?? 1
}

// ---------- History ----------

/** Lowercase, accent-free text for search. */
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr-FR').trim()
}

/** null = all categories, 'none' = uncategorized only, otherwise a category id. */
export type HistoryFilter = null | 'none' | string

export function filterExpenses(
  expenses: Expense[],
  query: string,
  filter: HistoryFilter
): Expense[] {
  const q = normalizeSearch(query)
  return expenses.filter(
    (e) =>
      (filter === null || (filter === 'none' ? e.categoryId === null : e.categoryId === filter)) &&
      (q === '' || normalizeSearch(e.label).includes(q))
  )
}

export interface DayGroup {
  date: string
  total: number
  expenses: Expense[]
}

/** Expenses grouped by day, most recent day first. */
export function groupByDay(expenses: Expense[]): DayGroup[] {
  const map = new Map<string, Expense[]>()
  for (const e of [...expenses].sort((a, b) => b.date.localeCompare(a.date))) {
    map.set(e.date, [...(map.get(e.date) ?? []), e])
  }
  return [...map].map(([date, list]) => ({
    date,
    total: sum(list.map((e) => e.amount)),
    expenses: list
  }))
}

// ---------- Evolution screen ----------

export interface MonthSavings {
  month: string
  savings: number
}

/** Savings of the last 12 completed months, from the first data month (oldest first). */
export function savingsSeries(data: BudjData, today: string): MonthSavings[] {
  const lastDone = addMonths(monthOf(today), -1)
  const from = [firstDataMonth(data, today), addMonths(lastDone, -11)].sort()[1]
  if (from > lastDone) return []
  return monthRange(from, lastDone).map((month) => ({ month, savings: savings(data, month) }))
}

/** Total spent in a month: fixed expenses + variable spending. */
export function monthSpent(data: BudjData, month: string): number {
  return fixedTotal(data, month) + variableSpent(data, month)
}

// ---------- Mobile history and evolution ----------

export interface PaidFixedEntry {
  fixed: FixedExpense
  date: string
}

/** Fixed expenses already charged in a month, with their charge date. */
export function paidFixedEntries(data: BudjData, month: string, today: string): PaidFixedEntry[] {
  return paidFixed(data, month, today).map((fixed) => ({
    fixed,
    date: makeDay(month, chargeDay(fixed, month))
  }))
}

export interface SpendingShare {
  /** Category id, 'fixed' or 'none'. */
  key: string
  amount: number
  ratio: number
}

/** What was really spent in a month so far, charged fixed expenses included, by category. */
export function spendingBreakdown(
  data: BudjData,
  month: string,
  today: string
): { total: number; shares: SpendingShare[] } {
  const amounts = [
    ...data.categories.map((c) => ({ key: c.id, amount: categorySpent(data, month, c.id) })),
    { key: 'fixed', amount: paidFixedTotal(data, month, today) },
    { key: 'none', amount: categorySpent(data, month, null) }
  ].filter((s) => s.amount > 0)
  const total = sum(amounts.map((s) => s.amount))
  return {
    total,
    shares: amounts
      .map((s) => ({ ...s, ratio: s.amount / total }))
      .sort((a, b) => b.amount - a.amount)
  }
}

/** Spending of a month against the whole previous month, in %. Null without a previous month. */
export function spendingTrend(data: BudjData, month: string, today: string): number | null {
  const prev = addMonths(month, -1)
  if (firstDataMonth(data, today) > prev) return null
  const previous = monthSpent(data, prev)
  if (previous === 0) return null
  return Math.round(((spendingBreakdown(data, month, today).total - previous) / previous) * 100)
}

export interface MonthRow {
  month: string
  spent: number
  savings: number
  ratio: number
  trend: number | null
}

/** Current month then past months, most recent first, down to the first data month. */
export function monthRows(data: BudjData, today: string): MonthRow[] {
  return monthRange(firstDataMonth(data, today), monthOf(today))
    .reverse()
    .map((month) => {
      const spent = monthSpent(data, month)
      const budget = monthBudget(data, month)
      return {
        month,
        spent,
        savings: savings(data, month),
        ratio: budget > 0 ? spent / budget : 1,
        trend: spendingTrend(data, month, today)
      }
    })
}
