import type { BudjData, Settings } from './types'
import { hasBudjStructure, isBudjData, isBudjDataV2 } from './validate'

type Obj = Record<string, unknown>
type List = Obj[]

/** Defaults of the v3 settings. `createdAt` is the only one that depends on the data. */
export function defaultSettings(createdAt: string): Settings {
  return {
    uiStyle: 'playfull',
    firstName: '',
    avatarColor: 'bleu',
    monthStartDay: 1,
    rolloverRemaining: false,
    showCents: true,
    currency: 'EUR',
    reminders: { evening: true, eveningTime: '21:00', chargeEve: true, budgetAlert80: false },
    createdAt
  }
}

/** v1 (Budj Desktop export) → v2: every entity gets an updatedAt. */
function migrateV1(raw: Obj, now: string): Obj {
  const stamp = (items: List): List => items.map((item) => ({ ...item, updatedAt: now }))
  return {
    ...raw,
    schemaVersion: 2,
    budgetHistory: stamp(raw.budgetHistory as List),
    categories: stamp(raw.categories as List),
    fixedSubcategories: stamp(raw.fixedSubcategories as List),
    fixedExpenses: stamp(raw.fixedExpenses as List),
    expenses: stamp(raw.expenses as List)
  }
}

/** Earliest trace of use: first category or first budget period, else now. */
function firstUse(raw: Obj, now: string): string {
  const days = [
    ...(raw.categories as List).map((c) => c.createdAt as string),
    ...(raw.budgetHistory as List).map((p) => `${p.fromMonth as string}-01`),
    ...(raw.expenses as List).map((e) => e.date as string)
  ].sort()
  return days.length > 0 ? `${days[0]}T00:00:00.000Z` : now
}

/** v2 → v3: settings, a savings goal of 0 on every period, category order = current order. */
function migrateV2(raw: Obj, now: string): Obj {
  const createdAt = firstUse(raw, now)
  return {
    ...raw,
    schemaVersion: 3,
    settings: {
      ...defaultSettings(createdAt),
      ...(raw.onboardingDone === true ? { onboardingCompletedAt: createdAt } : {})
    },
    budgetHistory: (raw.budgetHistory as List).map((p) => ({ ...p, savingsGoal: 0 })),
    categories: (raw.categories as List).map((c, order) => ({ ...c, order }))
  }
}

/** Brings stored or imported data to the current schema, or null if it is not valid Budj data. */
export function migrate(raw: unknown, now = new Date().toISOString()): BudjData | null {
  if (isBudjData(raw)) return raw
  let value = raw as Obj | null
  if (value?.schemaVersion === 1 && hasBudjStructure(value)) value = migrateV1(value, now)
  if (isBudjDataV2(value)) value = migrateV2(value as Obj, now)
  return isBudjData(value) ? value : null
}
