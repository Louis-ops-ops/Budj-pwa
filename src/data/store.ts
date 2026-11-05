import { create } from 'zustand'
import type {
  BudjData,
  Category,
  Expense,
  FixedExpense,
  FixedSubcategory
} from '../shared/types'
import { platform, StorageCorruptError } from '../platform/storage'
import { useUi } from '../ui/uiStore'
import * as m from './mutations'
import { monthOf, todayISO } from './dates'

export type StorageIssue = 'unavailable' | 'corrupt'

interface BudjState {
  data: BudjData
  ready: boolean
  storageIssue: StorageIssue | null
  load(): Promise<void>
  replaceData(data: BudjData): void
  startFresh(): void
  completeOnboarding(input: {
    monthlyBudget: number
    fixedExpenses: Omit<FixedExpense, 'id' | 'startMonth' | 'subcategoryId' | 'updatedAt'>[]
    categories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[]
  }): void
  setMonthlyBudget(amount: number): void
  addExpenses(expenses: Omit<Expense, 'id' | 'updatedAt'>[]): void
  updateExpense(expense: Expense): void
  deleteExpenses(ids: string[]): void
  moveExpenses(ids: string[], categoryId: string | null): void
  addCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category
  updateCategory(category: Category): void
  deleteCategory(id: string): void
  addFixedExpense(fixed: Omit<FixedExpense, 'id' | 'startMonth' | 'updatedAt'>): void
  updateFixedExpense(fixed: FixedExpense): void
  deleteFixedExpense(id: string): void
  addFixedSubcategory(name: string): FixedSubcategory
}

export const newId = (): string => crypto.randomUUID()
const nowISO = (): string => new Date().toISOString()

let loading = false

export const useBudj = create<BudjState>()((set, get) => {
  const apply = (fn: (data: BudjData) => BudjData): void => {
    const prev = get().data
    set({ data: m.stampChanges(prev, fn(prev), nowISO()) })
  }

  return {
    data: m.emptyData(),
    ready: false,
    storageIssue: null,

    async load() {
      if (loading) return
      loading = true
      try {
        const data = await platform.loadData()
        set({ data: data ?? m.emptyData(), ready: true })
        if (platform.restoredFromBackup()) {
          useUi.getState().toast('Tes données ont été restaurées depuis la sauvegarde interne')
        }
      } catch (error) {
        const corrupt = error instanceof StorageCorruptError
        set({ ready: true, storageIssue: corrupt ? 'corrupt' : 'unavailable' })
      }
    },

    replaceData(data) {
      set({ data, storageIssue: null })
    },

    startFresh() {
      set({ data: m.emptyData(), storageIssue: null })
    },

    completeOnboarding({ monthlyBudget, fixedExpenses, categories }) {
      const today = todayISO()
      const month = monthOf(today)
      const updatedAt = nowISO()
      const subcategories = m.DEFAULT_FIXED_SUBCATEGORIES.map((name) => ({
        id: newId(),
        name,
        updatedAt
      }))
      // Fixed expenses typed during setup are filed under "Factures" by default.
      const bills = subcategories[1].id
      set({
        data: {
          schemaVersion: 2,
          onboardingDone: true,
          budgetHistory: [{ fromMonth: month, amount: monthlyBudget, updatedAt }],
          fixedSubcategories: subcategories,
          fixedExpenses: fixedExpenses.map((f) => ({
            ...f,
            id: newId(),
            subcategoryId: bills,
            startMonth: month,
            updatedAt
          })),
          categories: categories.map((c) => ({ ...c, id: newId(), createdAt: today, updatedAt })),
          expenses: []
        }
      })
    },

    setMonthlyBudget(amount) {
      apply((d) => m.setMonthlyBudget(d, amount, monthOf(todayISO())))
    },

    addExpenses(expenses) {
      apply((d) =>
        m.addExpenses(
          d,
          expenses.map((e) => ({ ...e, id: newId(), updatedAt: nowISO() }))
        )
      )
    },

    updateExpense(expense) {
      apply((d) => m.updateExpense(d, expense))
    },

    deleteExpenses(ids) {
      apply((d) => m.deleteExpenses(d, ids))
    },

    moveExpenses(ids, categoryId) {
      apply((d) => m.moveExpenses(d, ids, categoryId))
    },

    addCategory(input) {
      const category: Category = {
        ...input,
        id: newId(),
        createdAt: todayISO(),
        updatedAt: nowISO()
      }
      apply((d) => m.addCategory(d, category))
      return category
    },

    updateCategory(category) {
      apply((d) => m.updateCategory(d, category))
    },

    deleteCategory(id) {
      apply((d) => m.deleteCategory(d, id))
    },

    addFixedExpense(input) {
      const fixed: FixedExpense = {
        ...input,
        id: newId(),
        startMonth: monthOf(todayISO()),
        updatedAt: nowISO()
      }
      apply((d) => m.addFixedExpense(d, fixed))
    },

    updateFixedExpense(fixed) {
      apply((d) => m.editFixedExpense(d, fixed, monthOf(todayISO()), newId()))
    },

    deleteFixedExpense(id) {
      apply((d) => m.deleteFixedExpense(d, id, monthOf(todayISO())))
    },

    addFixedSubcategory(name) {
      const sub = { id: newId(), name: name.trim(), updatedAt: nowISO() }
      apply((d) => m.addFixedSubcategory(d, sub))
      return sub
    }
  }
})

// ---------- Persistence: debounced write on every change, immediate flush when leaving ----------

const SAVE_DELAY_MS = 300
let timer: ReturnType<typeof setTimeout> | null = null
let pending: BudjData | null = null
let applyingExternalChange = false

async function flush(): Promise<void> {
  if (timer) clearTimeout(timer)
  timer = null
  if (!pending) return
  const data = pending
  pending = null
  try {
    await platform.saveData(data)
  } catch {
    useBudj.setState({ storageIssue: 'unavailable' })
  }
}

useBudj.subscribe((state, prev) => {
  if (!state.ready || state.data === prev.data || !prev.ready || applyingExternalChange) return
  pending = state.data
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void flush(), SAVE_DELAY_MS)
})

// beforeunload alone is not reliable on mobile.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void flush()
})
window.addEventListener('pagehide', () => void flush())

// Another tab saved: reload so this one does not overwrite it with stale data.
// Edits still pending here are newer, they win and the other tab reloads in turn.
platform.onExternalChange(() => {
  void (async () => {
    if (pending || !useBudj.getState().ready) return
    const data = await platform.loadData().catch(() => null)
    if (!data || pending) return
    applyingExternalChange = true
    useBudj.setState({ data })
    applyingExternalChange = false
  })()
})

export const flushSave = flush
