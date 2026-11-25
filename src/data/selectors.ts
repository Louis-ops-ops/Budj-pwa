// Pure calculations (CLAUDE.md §7.2). No React here: screens never add numbers themselves.
import type { BudjData, Category, Expense, FixedExpense } from '../shared/types'
import { periodAt } from './mutations'
import {
  addDays,
  addMonths,
  budgetMonthOf,
  chargeDateIn,
  daysBetween,
  daysInMonth,
  dayNumber,
  makeDay,
  monthOf,
  monthRange,
  periodBounds,
  weekdayIndex
} from './dates'

const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0)

// ---------- Budget and fixed expenses ----------

/** First day of the budget month (Réglages › Début du mois). */
export const startDay = (data: BudjData): number => data.settings.monthStartDay

/** Budget month a day belongs to. */
export const budgetMonth = (data: BudjData, day: string): string =>
  budgetMonthOf(day, startDay(data))

/** Budget month containing today. */
export const currentMonth = (data: BudjData, today: string): string => budgetMonth(data, today)

/** First and last day of a budget month. */
export const monthBounds = (data: BudjData, month: string): { first: string; last: string } =>
  periodBounds(month, startDay(data))

/**
 * Budget of a month: the last period starting on or before it.
 * Months before the first period use the first known budget.
 */
export function monthBudget(data: BudjData, month: string): number {
  return periodAt(data, month)?.amount ?? 0
}

/** Savings goal of a month, from the period of that time (v3 §5.2). */
export function savingsGoal(data: BudjData, month: string): number {
  return periodAt(data, month)?.savingsGoal ?? 0
}

/** Categories in their display order. */
export function orderedCategories(data: BudjData): Category[] {
  return [...data.categories].sort((a, b) => a.order - b.order)
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

/** Date a fixed expense is charged within a budget month. */
export function chargeDate(data: BudjData, fixed: FixedExpense, month: string): string {
  return chargeDateIn(month, fixed.dayOfMonth, startDay(data))
}

/** Fixed expenses already charged: all for a past month, none for a future one. */
export function paidFixed(data: BudjData, month: string, today: string): FixedExpense[] {
  return activeFixed(data, month).filter((f) => isFixedPaid(data, f, month, today))
}

export function paidFixedTotal(data: BudjData, month: string, today: string): number {
  return sum(paidFixed(data, month, today).map((f) => f.amount))
}

export function annualCost(fixed: Pick<FixedExpense, 'amount'>): number {
  return fixed.amount * 12
}

// ---------- Variable spending ----------

export function expensesOfMonth(data: BudjData, month: string): Expense[] {
  const sd = startDay(data)
  return data.expenses.filter((e) => budgetMonthOf(e.date, sd) === month)
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

/**
 * What is left to spend: « se payer en premier », the savings goal is reserved
 * from the 1st like a fixed expense (v3 §6).
 */
export function globalRemaining(data: BudjData, month: string): number {
  return (
    monthBudget(data, month) -
    fixedTotal(data, month) -
    savingsGoal(data, month) -
    variableSpent(data, month)
  )
}

export interface BudgetGauge {
  budget: number
  fixed: number
  savings: number
  spent: number
  remaining: number
  /** Value that the segments are proportional to (≥ budget when overspent). */
  scale: number
}

export function budgetGauge(data: BudjData, month: string): BudgetGauge {
  const budget = monthBudget(data, month)
  const fixed = fixedTotal(data, month)
  const savings = savingsGoal(data, month)
  const spent = variableSpent(data, month)
  const remaining = Math.max(0, budget - fixed - savings - spent)
  return {
    budget,
    fixed,
    savings,
    spent,
    remaining,
    scale: Math.max(budget, fixed + savings + spent)
  }
}

/** Days from today to the end of the budget month, today included (0 outside it). */
export function daysLeft(data: BudjData, month: string, today: string): number {
  if (month !== currentMonth(data, today)) return 0
  return daysBetween(today, monthBounds(data, month).last) + 1
}

/** Remaining per day until the end of the month, today included. Null if not relevant. */
export function dailyPace(data: BudjData, month: string, today: string): number | null {
  if (month !== currentMonth(data, today)) return null
  const remaining = globalRemaining(data, month)
  if (remaining <= 0) return null
  return Math.floor(remaining / daysLeft(data, month, today))
}

export type SavingsStatus =
  | { status: 'onTrack'; shortfall: 0 }
  | { status: 'atRisk'; shortfall: number }

/** The goal holds as long as the remaining stays ≥ 0. */
export function savingsStatus(data: BudjData, month: string): SavingsStatus {
  const remaining = globalRemaining(data, month)
  return remaining >= 0
    ? { status: 'onTrack', shortfall: 0 }
    : { status: 'atRisk', shortfall: -remaining }
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
  return orderedCategories(data).map((c) => categoryStatus(data, month, c))
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

export function categoriesBudget(data: BudjData): number {
  return sum(data.categories.map((c) => c.monthlyBudget))
}

/** Categories + fixed expenses + savings goal. */
export function allocatedBudget(data: BudjData, month: string): number {
  return categoriesBudget(data) + fixedTotal(data, month) + savingsGoal(data, month)
}

export interface BudgetBreakdown {
  budget: number
  fixed: number
  savings: number
  categories: number
  /** Negative when more is allocated than the budget (non-blocking alert). */
  toAllocate: number
}

/** Repartition bar of the Budget and Gérer les catégories screens. */
export function budgetBreakdown(data: BudjData, month: string): BudgetBreakdown {
  const budget = monthBudget(data, month)
  const fixed = fixedTotal(data, month)
  const savings = savingsGoal(data, month)
  const categories = categoriesBudget(data)
  return { budget, fixed, savings, categories, toAllocate: budget - fixed - savings - categories }
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
  const month = currentMonth(data, today)
  const charges = (m: string, nextMonth: boolean): UpcomingCharge[] =>
    activeFixed(data, m)
      .map((fixed) => ({ fixed, date: chargeDate(data, fixed, m), nextMonth }))
      .sort((a, b) => a.date.localeCompare(b.date))

  const current = charges(month, false).filter((c) => c.date > today)
  const following = charges(addMonths(month, 1), true)
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

/**
 * Savings of a month: budget − (fixed + variable spending). The reserved goal
 * is part of it (v3 §6).
 */
export function monthSavings(data: BudjData, month: string): number {
  return monthBudget(data, month) - fixedTotal(data, month) - variableSpent(data, month)
}

/** Older name, used by the existing screens: same as monthSavings. */
export const savings = monthSavings

export function goalReached(data: BudjData, month: string): boolean {
  return monthSavings(data, month) >= savingsGoal(data, month)
}

export type MonthGoalState = 'reached' | 'below' | 'missed'

/** reached: ≥ goal · below: ≥ 0 and < goal · missed: < 0. */
export function monthGoalState(data: BudjData, month: string): MonthGoalState {
  const saved = monthSavings(data, month)
  if (saved >= savingsGoal(data, month)) return 'reached'
  return saved >= 0 ? 'below' : 'missed'
}

/**
 * What a month adds to the savings total. Report du reste on (Louis: leftover
 * goes to savings): the whole leftover. Off: the reserved goal at most.
 */
export function monthSaved(data: BudjData, month: string): number {
  const saved = monthSavings(data, month)
  return data.settings.rolloverRemaining ? saved : Math.min(saved, savingsGoal(data, month))
}

/** First month with any data (budget, fixed expense or expense). */
export function firstDataMonth(data: BudjData, today: string): string {
  const candidates = [
    ...data.budgetHistory.map((p) => p.fromMonth),
    ...data.fixedExpenses.map((f) => f.startMonth),
    ...data.expenses.map((e) => budgetMonth(data, e.date))
  ]
  const current = currentMonth(data, today)
  return candidates.reduce((min, m) => (m < min ? m : min), current)
}

/** Months from the first data month to the current one (for month pickers). */
export function availableMonths(data: BudjData, today: string): string[] {
  return monthRange(firstDataMonth(data, today), currentMonth(data, today))
}

/** Completed months since the user started (settings.createdAt), the last `limit` ones, oldest first. */
export function completedMonths(data: BudjData, today: string, limit = Infinity): string[] {
  const lastDone = addMonths(currentMonth(data, today), -1)
  const started = budgetMonth(data, data.settings.createdAt.slice(0, 10))
  const first = [firstDataMonth(data, today), started].sort()[1]
  if (first > lastDone) return []
  const months = monthRange(first, lastDone)
  return Number.isFinite(limit) ? months.slice(-limit) : months
}

/** Total put aside since the start, completed months only. */
export function savedSinceStart(data: BudjData, today: string): number {
  return sum(completedMonths(data, today).map((m) => monthSaved(data, m)))
}

/** « Atteint 2 mois sur 6 »: over the last n completed months. */
export function goalHitCount(
  data: BudjData,
  today: string,
  n = 6
): { hit: number; total: number } {
  const months = completedMonths(data, today, n)
  return { hit: months.filter((m) => goalReached(data, m)).length, total: months.length }
}

export interface GoalMonth {
  month: string
  saved: number
  goal: number
  state: MonthGoalState
}

/** Last n completed months (oldest first) with the goal of that time. */
export function goalHistory(data: BudjData, today: string, n = 6): GoalMonth[] {
  return completedMonths(data, today, n).map((month) => ({
    month,
    saved: monthSavings(data, month),
    goal: savingsGoal(data, month),
    state: monthGoalState(data, month)
  }))
}

export interface ProfileSummary {
  best: { month: string; savings: number } | null
  averageSpent: number
  topCategory: { category: Category; spent: number } | null
  green: { count: number; total: number }
}

/** « Mon bilan » of the Profile: completed months only (last 12). */
export function profileSummary(data: BudjData, today: string): ProfileSummary {
  const months = completedMonths(data, today, 12)
  const best = months.reduce<ProfileSummary['best']>((acc, month) => {
    const value = monthSavings(data, month)
    return acc === null || value > acc.savings ? { month, savings: value } : acc
  }, null)
  const top = data.categories
    .map((category) => ({
      category,
      spent: sum(months.map((m) => categorySpent(data, m, category.id)))
    }))
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)[0]
  return {
    best,
    averageSpent: months.length
      ? Math.round(sum(months.map((m) => monthSpent(data, m))) / months.length)
      : 0,
    topCategory: top ?? null,
    green: {
      count: months.filter((m) => monthSavings(data, m) >= 0).length,
      total: months.length
    }
  }
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
  const lastDone = addMonths(currentMonth(data, today), -1)
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
  if (month !== currentMonth(data, today)) return null
  const remaining = category.monthlyBudget - categorySpent(data, month, category.id)
  if (remaining <= 0) return null
  return Math.floor(remaining / daysLeft(data, month, today))
}

export interface CategoryStats {
  /** Spent ÷ elapsed days (0 before the month starts). */
  perDay: number
  daysLeft: number
  /** Against the previous month, in %. Null without spending last month. */
  deltaVsPrevious: number | null
}

/** Statistics card of the category detail (v3 §7.5). */
export function categoryStats(
  data: BudjData,
  category: Category,
  month: string,
  today: string
): CategoryStats {
  const { first, last } = monthBounds(data, month)
  const current = currentMonth(data, today)
  const elapsed =
    month < current
      ? daysBetween(first, last) + 1
      : month > current
        ? 0
        : daysBetween(first, today) + 1
  const spent = categorySpent(data, month, category.id)
  const previous = categorySpent(data, addMonths(month, -1), category.id)
  return {
    perDay: elapsed > 0 ? Math.round(spent / elapsed) : 0,
    daysLeft: daysLeft(data, month, today),
    deltaVsPrevious: previous > 0 ? Math.round(((spent - previous) / previous) * 100) : null
  }
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

export function isFixedPaid(
  data: BudjData,
  fixed: FixedExpense,
  month: string,
  today: string
): boolean {
  const current = currentMonth(data, today)
  if (month < current) return true
  if (month > current) return false
  return chargeDate(data, fixed, month) <= today
}

export type FixedChargeStatus =
  | { status: 'paid'; date: string }
  | { status: 'upcoming'; date: string; daysUntil: number }

/** « Prélevé » / « À venir » of a fixed expense in the current month. */
export function fixedChargeStatus(
  data: BudjData,
  fixed: FixedExpense,
  today: string
): FixedChargeStatus {
  const date = chargeDate(data, fixed, currentMonth(data, today))
  return date <= today
    ? { status: 'paid', date }
    : { status: 'upcoming', date, daysUntil: daysBetween(today, date) }
}

export interface WeekDay {
  date: string
  charges: FixedExpense[]
}

/** Fixed charges of the current week, Monday → Sunday (« Cette semaine » card). */
export function weekCharges(data: BudjData, today: string): WeekDay[] {
  const monday = addDays(today, -weekdayIndex(today))
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i)
    const month = budgetMonth(data, date)
    return {
      date,
      charges: activeFixed(data, month).filter((f) => chargeDate(data, f, month) === date)
    }
  })
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
  const lastDone = addMonths(currentMonth(data, today), -1)
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
  return monthRange(firstDataMonth(data, today), currentMonth(data, today))
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

// ---------- To categorize ----------

/** Expenses without a category, most recent first (« À catégoriser » sorting). */
export function uncategorized(data: BudjData, month: string): Expense[] {
  return expensesOfMonth(data, month)
    .filter((e) => e.categoryId === null)
    .sort((a, b) => b.date.localeCompare(a.date))
}

// ---------- Onboarding ----------

export interface SuggestedCategory {
  name: string
  color: Category['color']
  /** Share of the budget left after savings. */
  percent: number
}

/** v3 §7.1, kept by Louis on 2026-11-25. */
export const SUGGESTED_CATEGORIES: SuggestedCategory[] = [
  { name: 'Courses', color: 'vert', percent: 15 },
  { name: 'Restaurant', color: 'orange', percent: 8 },
  { name: 'Sorties', color: 'mauve', percent: 5 },
  { name: 'Loisirs', color: 'cyan', percent: 5 },
  { name: 'Transport', color: 'rouge', percent: 4 },
  { name: 'Shopping', color: 'mauve', percent: 8 },
  { name: 'Santé', color: 'vert', percent: 3 },
  { name: 'Cadeaux', color: 'orange', percent: 3 }
]

const roundTo = (value: number, step: number): number => Math.round(value / step) * step

/**
 * Discreet suggestions of the onboarding: savings = 5 % of the budget rounded
 * to 5 €, categories = % of what is left after savings, rounded to 10 €.
 * `savings` replaces the suggested goal when the user typed one.
 */
export function onboardingSuggestions(
  budget: number,
  savings?: number
): { savings: number; categories: Record<string, number> } {
  const suggestedSavings = roundTo(budget * 0.05, 500)
  const base = Math.max(0, budget - (savings ?? suggestedSavings))
  return {
    savings: suggestedSavings,
    categories: Object.fromEntries(
      SUGGESTED_CATEGORIES.map((c) => [c.name, roundTo((base * c.percent) / 100, 1000)])
    )
  }
}

// ---------- Pro: curve of the remaining ----------

export interface RemainingCurve {
  /** Spendable at the start of the month: budget − fixed − savings goal. */
  start: number
  /** Number of days in the budget month. */
  length: number
  /** Remaining at the end of each day, from the first day up to today (or the whole past month). */
  points: number[]
}

/** Real remaining day by day, against the ideal straight line from `start` to 0. */
export function remainingCurve(data: BudjData, month: string, today: string): RemainingCurve {
  const { first, last } = monthBounds(data, month)
  const length = daysBetween(first, last) + 1
  const start = monthBudget(data, month) - fixedTotal(data, month) - savingsGoal(data, month)
  const current = currentMonth(data, today)
  const shown = month < current ? length : month > current ? 0 : daysBetween(first, today) + 1
  const byDay = new Map<string, number>()
  for (const e of expensesOfMonth(data, month)) byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount)
  const points: number[] = []
  let remaining = start
  for (let i = 0; i < shown; i++) {
    remaining -= byDay.get(addDays(first, i)) ?? 0
    points.push(remaining)
  }
  return { start, length, points }
}
