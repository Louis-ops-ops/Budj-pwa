// Pure data transformations used by the store actions (testable without React).
import type {
  BudgetPeriod,
  BudjData,
  Category,
  Expense,
  FixedExpense,
  FixedSubcategory,
  Settings
} from '../shared/types'
import { defaultSettings } from '../shared/migrate'
import { addMonths } from './dates'

export const DEFAULT_FIXED_SUBCATEGORIES = ['Épargne', 'Factures', 'Distractions']

type Stamped = { updatedAt: string }

function stampList<T extends Stamped>(prev: T[], next: T[], now: string): T[] {
  const known = new Set(prev)
  return next.map((item) => (known.has(item) ? item : { ...item, updatedAt: now }))
}

/** Sets updatedAt on every entity that is new or changed between two states. */
export function stampChanges(prev: BudjData, next: BudjData, now: string): BudjData {
  return {
    ...next,
    budgetHistory: stampList(prev.budgetHistory, next.budgetHistory, now),
    categories: stampList(prev.categories, next.categories, now),
    fixedSubcategories: stampList(prev.fixedSubcategories, next.fixedSubcategories, now),
    fixedExpenses: stampList(prev.fixedExpenses, next.fixedExpenses, now),
    expenses: stampList(prev.expenses, next.expenses, now)
  }
}

export function emptyData(now = new Date().toISOString()): BudjData {
  return {
    schemaVersion: 3,
    onboardingDone: false,
    settings: defaultSettings(now),
    budgetHistory: [],
    categories: [],
    fixedSubcategories: [],
    fixedExpenses: [],
    expenses: []
  }
}

/** Period in effect for a month (months before the first period use the first one). */
export function periodAt(data: BudjData, month: string): BudgetPeriod | null {
  const history = data.budgetHistory
  if (history.length === 0) return null
  let period = history[0]
  for (const p of history) {
    if (p.fromMonth <= month) period = p
    else break
  }
  return period
}

/**
 * Changes the period starting at `month` (created from the one in effect if needed),
 * so past months keep the budget and savings goal they really had.
 */
function setPeriod(
  data: BudjData,
  month: string,
  patch: Partial<Pick<BudgetPeriod, 'amount' | 'savingsGoal'>>
): BudjData {
  const current = periodAt(data, month)
  const next: BudgetPeriod = {
    amount: current?.amount ?? 0,
    savingsGoal: current?.savingsGoal ?? 0,
    ...patch,
    fromMonth: month,
    updatedAt: ''
  }
  const others = data.budgetHistory.filter((p) => p.fromMonth !== month)
  const budgetHistory = [...others, next].sort((a, b) => a.fromMonth.localeCompare(b.fromMonth))
  return { ...data, budgetHistory }
}

/** Replaces or adds the budget period starting at `month`. */
export function setMonthlyBudget(data: BudjData, amount: number, month: string): BudjData {
  return setPeriod(data, month, { amount })
}

/** Savings goal from `month` on (same history logic as the budget). */
export function setSavingsGoal(data: BudjData, savingsGoal: number, month: string): BudjData {
  return setPeriod(data, month, { savingsGoal })
}

export function updateSettings(data: BudjData, patch: Partial<Settings>): BudjData {
  return { ...data, settings: { ...data.settings, ...patch } }
}

/** Next free position at the end of the category list. */
export function nextCategoryOrder(data: BudjData): number {
  return data.categories.reduce((max, c) => Math.max(max, c.order + 1), 0)
}

/** New order of the categories, by id (Gérer les catégories › Réorganiser). */
export function reorderCategories(data: BudjData, ids: string[]): BudjData {
  const position = new Map(ids.map((id, index) => [id, index]))
  return {
    ...data,
    categories: data.categories.map((c) => {
      const order = position.get(c.id) ?? ids.length + c.order
      return order === c.order ? c : { ...c, order }
    })
  }
}

export function addExpenses(data: BudjData, expenses: Expense[]): BudjData {
  return { ...data, expenses: [...data.expenses, ...expenses] }
}

export function updateExpense(data: BudjData, expense: Expense): BudjData {
  return { ...data, expenses: data.expenses.map((e) => (e.id === expense.id ? expense : e)) }
}

export function deleteExpenses(data: BudjData, ids: string[]): BudjData {
  const set = new Set(ids)
  return { ...data, expenses: data.expenses.filter((e) => !set.has(e.id)) }
}

export function moveExpenses(data: BudjData, ids: string[], categoryId: string | null): BudjData {
  const set = new Set(ids)
  return {
    ...data,
    expenses: data.expenses.map((e) => (set.has(e.id) ? { ...e, categoryId } : e))
  }
}

export function isCategoryNameTaken(data: BudjData, name: string, exceptId?: string): boolean {
  const key = name.trim().toLocaleLowerCase('fr-FR')
  return data.categories.some(
    (c) => c.id !== exceptId && c.name.trim().toLocaleLowerCase('fr-FR') === key
  )
}

export function addCategory(data: BudjData, category: Category): BudjData {
  return { ...data, categories: [...data.categories, category] }
}

export function updateCategory(data: BudjData, category: Category): BudjData {
  return {
    ...data,
    categories: data.categories.map((c) => (c.id === category.id ? category : c))
  }
}

/** Deletes a category; its expenses become uncategorized. */
export function deleteCategory(data: BudjData, id: string): BudjData {
  return {
    ...data,
    categories: data.categories.filter((c) => c.id !== id),
    expenses: data.expenses.map((e) => (e.categoryId === id ? { ...e, categoryId: null } : e))
  }
}

export function addFixedExpense(data: BudjData, fixed: FixedExpense): BudjData {
  return { ...data, fixedExpenses: [...data.fixedExpenses, fixed] }
}

export function updateFixedExpense(data: BudjData, fixed: FixedExpense): BudjData {
  return {
    ...data,
    fixedExpenses: data.fixedExpenses.map((f) => (f.id === fixed.id ? fixed : f))
  }
}

/**
 * Deletes a fixed expense from `currentMonth` on. If it already counted in a
 * past month, it is ended (endMonth = previous month) so history stays intact.
 */
export function deleteFixedExpense(data: BudjData, id: string, currentMonth: string): BudjData {
  const fixed = data.fixedExpenses.find((f) => f.id === id)
  if (!fixed) return data
  const countedBefore = fixed.startMonth < currentMonth
  if (!countedBefore) {
    return { ...data, fixedExpenses: data.fixedExpenses.filter((f) => f.id !== id) }
  }
  const endMonth = addMonths(currentMonth, -1)
  return updateFixedExpense(data, {
    ...fixed,
    endMonth: fixed.endMonth && fixed.endMonth < endMonth ? fixed.endMonth : endMonth
  })
}

export function addFixedSubcategory(data: BudjData, subcategory: FixedSubcategory): BudjData {
  return { ...data, fixedSubcategories: [...data.fixedSubcategories, subcategory] }
}

export function isSubcategoryNameTaken(data: BudjData, name: string): boolean {
  const key = name.trim().toLocaleLowerCase('fr-FR')
  return data.fixedSubcategories.some((s) => s.name.trim().toLocaleLowerCase('fr-FR') === key)
}

/**
 * Edits a fixed expense from `currentMonth` on. If it already counted in a past
 * month, the old version is ended last month and a new version starts this month,
 * so past months keep the amount, day and label they really had.
 */
export function editFixedExpense(
  data: BudjData,
  updated: FixedExpense,
  currentMonth: string,
  newId: string
): BudjData {
  const old = data.fixedExpenses.find((f) => f.id === updated.id)
  if (!old) return data
  const changed =
    old.amount !== updated.amount ||
    old.dayOfMonth !== updated.dayOfMonth ||
    old.label !== updated.label ||
    old.subcategoryId !== updated.subcategoryId
  if (!changed) return data
  if (old.startMonth >= currentMonth) return updateFixedExpense(data, updated)
  const ended: FixedExpense = { ...old, endMonth: addMonths(currentMonth, -1) }
  const next: FixedExpense = { ...updated, id: newId, startMonth: currentMonth }
  return {
    ...data,
    fixedExpenses: [...data.fixedExpenses.map((f) => (f.id === old.id ? ended : f)), next]
  }
}
