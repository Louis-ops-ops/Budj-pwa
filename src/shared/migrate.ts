import type { BudjData } from './types'
import { hasBudjStructure, isBudjData } from './validate'

type WithoutStamp<T> = Omit<T, 'updatedAt'>

/** v1 (Budj Desktop export) → v2: every entity gets an updatedAt. */
function migrateV1(raw: BudjData, now: string): BudjData {
  const stamp = <T>(items: WithoutStamp<T>[]): T[] =>
    items.map((item) => ({ ...item, updatedAt: now }) as T)
  return {
    ...raw,
    schemaVersion: 2,
    budgetHistory: stamp(raw.budgetHistory),
    categories: stamp(raw.categories),
    fixedSubcategories: stamp(raw.fixedSubcategories),
    fixedExpenses: stamp(raw.fixedExpenses),
    expenses: stamp(raw.expenses)
  }
}

/** Brings stored or imported data to the current schema, or null if it is not valid Budj data. */
export function migrate(raw: unknown, now = new Date().toISOString()): BudjData | null {
  if (isBudjData(raw)) return raw
  if ((raw as { schemaVersion?: unknown } | null)?.schemaVersion === 1 && hasBudjStructure(raw)) {
    return migrateV1(raw as BudjData, now)
  }
  return null
}
