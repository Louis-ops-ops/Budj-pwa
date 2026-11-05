import { CATEGORY_COLORS, PAYMENT_METHODS, type BudjData } from './types'

const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isCents = (v: unknown): v is number => Number.isSafeInteger(v)
const isDay = (v: unknown): boolean => isStr(v) && DAY.test(v)
const isMonth = (v: unknown): boolean => isStr(v) && MONTH.test(v)
const isArrayOf = (v: unknown, check: (item: Obj) => boolean): boolean =>
  Array.isArray(v) && v.every((item) => isObj(item) && check(item))

/** Structure shared by every schema version. */
export function hasBudjStructure(value: unknown): boolean {
  if (!isObj(value) || typeof value.onboardingDone !== 'boolean') return false

  return (
    isArrayOf(value.budgetHistory, (p) => isMonth(p.fromMonth) && isCents(p.amount)) &&
    isArrayOf(
      value.categories,
      (c) =>
        isStr(c.id) &&
        isStr(c.name) &&
        c.name.trim() !== '' &&
        CATEGORY_COLORS.includes(c.color as never) &&
        (c.customHue === undefined ||
          (Number.isInteger(c.customHue) &&
            (c.customHue as number) >= 0 &&
            (c.customHue as number) < 360)) &&
        isCents(c.monthlyBudget) &&
        isDay(c.createdAt)
    ) &&
    isArrayOf(value.fixedSubcategories, (s) => isStr(s.id) && isStr(s.name)) &&
    isArrayOf(
      value.fixedExpenses,
      (f) =>
        isStr(f.id) &&
        isStr(f.label) &&
        isCents(f.amount) &&
        Number.isInteger(f.dayOfMonth) &&
        (f.dayOfMonth as number) >= 1 &&
        (f.dayOfMonth as number) <= 31 &&
        isStr(f.subcategoryId) &&
        isMonth(f.startMonth) &&
        (f.endMonth === undefined || isMonth(f.endMonth))
    ) &&
    isArrayOf(
      value.expenses,
      (e) =>
        isStr(e.id) &&
        isCents(e.amount) &&
        isStr(e.label) &&
        (e.categoryId === null || isStr(e.categoryId)) &&
        isDay(e.date) &&
        (e.paymentMethod === undefined || PAYMENT_METHODS.includes(e.paymentMethod as never))
    )
  )
}

const LISTS = [
  'budgetHistory',
  'categories',
  'fixedSubcategories',
  'fixedExpenses',
  'expenses'
] as const

/** Validation of current data: structure, schema version and updatedAt on every entity. */
export function isBudjData(value: unknown): value is BudjData {
  if (!isObj(value) || value.schemaVersion !== 2 || !hasBudjStructure(value)) return false
  return LISTS.every((list) => isArrayOf(value[list], (item) => isStr(item.updatedAt)))
}
