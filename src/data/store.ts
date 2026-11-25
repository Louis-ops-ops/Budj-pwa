import { create } from 'zustand'
import type {
  AvatarColor,
  BudjData,
  Category,
  Expense,
  FixedExpense,
  FixedSubcategory,
  Settings
} from '../shared/types'
import { platform, StorageCorruptError } from '../platform/storage'
import { useUi } from '../ui/uiStore'
import * as m from './mutations'
import { todayISO } from './dates'
import { currentMonth } from './selectors'
import { crossedBudgetAlert } from './reminders'

export type StorageIssue = 'unavailable' | 'corrupt'

export type NewCategory = Omit<Category, 'id' | 'order' | 'createdAt' | 'updatedAt'>

interface BudjState {
  data: BudjData
  ready: boolean
  storageIssue: StorageIssue | null
  load(): Promise<void>
  replaceData(data: BudjData): void
  startFresh(): void
  completeOnboarding(input: {
    firstName: string
    avatarColor?: AvatarColor
    monthlyBudget: number
    savingsGoal: number
    fixedExpenses?: Omit<FixedExpense, 'id' | 'startMonth' | 'subcategoryId' | 'updatedAt'>[]
    categories: NewCategory[]
  }): void
  setMonthlyBudget(amount: number): void
  setSavingsGoal(amount: number): void
  updateSettings(patch: Partial<Settings>): void
  reorderCategories(ids: string[]): void
  /** Réglages › Réinitialiser: empties the data (data-bak is kept), back to the onboarding. */
  resetApp(): void
  addExpenses(expenses: Omit<Expense, 'id' | 'updatedAt'>[]): void
  updateExpense(expense: Expense): void
  deleteExpenses(ids: string[]): void
  moveExpenses(ids: string[], categoryId: string | null): void
  addCategory(category: NewCategory): Category
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
        if (data?.onboardingDone) void platform.requestPersistence()
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

    completeOnboarding({
      firstName,
      avatarColor,
      monthlyBudget,
      savingsGoal,
      fixedExpenses = [],
      categories
    }) {
      void platform.requestPersistence()
      const today = todayISO()
      const previous = get().data.settings
      const updatedAt = nowISO()
      const settings: Settings = {
        ...previous,
        firstName: firstName.trim(),
        avatarColor: avatarColor ?? previous.avatarColor,
        onboardingCompletedAt: updatedAt,
        createdAt: updatedAt
      }
      const month = currentMonth({ ...get().data, settings }, today)
      const subcategories = m.DEFAULT_FIXED_SUBCATEGORIES.map((name) => ({
        id: newId(),
        name,
        updatedAt
      }))
      // Fixed expenses typed during setup are filed under "Factures" by default.
      const bills = subcategories[1].id
      set({
        data: {
          schemaVersion: 3,
          onboardingDone: true,
          settings,
          budgetHistory: [{ fromMonth: month, amount: monthlyBudget, savingsGoal, updatedAt }],
          fixedSubcategories: subcategories,
          fixedExpenses: fixedExpenses.map((f) => ({
            ...f,
            id: newId(),
            subcategoryId: bills,
            startMonth: month,
            updatedAt
          })),
          categories: categories.map((c, order) => ({
            ...c,
            id: newId(),
            order,
            createdAt: today,
            updatedAt
          })),
          expenses: []
        }
      })
    },

    setMonthlyBudget(amount) {
      apply((d) => m.setMonthlyBudget(d, amount, currentMonth(d, todayISO())))
    },

    setSavingsGoal(amount) {
      apply((d) => m.setSavingsGoal(d, amount, currentMonth(d, todayISO())))
    },

    updateSettings(patch) {
      apply((d) => m.updateSettings(d, patch))
    },

    reorderCategories(ids) {
      apply((d) => m.reorderCategories(d, ids))
    },

    resetApp() {
      // Keeps the display preferences: the onboarding starts again in the same style.
      const { uiStyle } = get().data.settings
      const empty = m.emptyData()
      set({ data: { ...empty, settings: { ...empty.settings, uiStyle } } })
    },

    addExpenses(expenses) {
      const before = get().data
      apply((d) =>
        m.addExpenses(
          d,
          expenses.map((e) => ({ ...e, id: newId(), updatedAt: nowISO() }))
        )
      )
      // v3 §7.13: « Courses : 80 % du budget atteint » when a category crosses 80 %.
      const month = currentMonth(before, todayISO())
      for (const message of crossedBudgetAlert(before, get().data, month)) {
        useUi.getState().toast(message)
      }
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
        order: m.nextCategoryOrder(get().data),
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
        startMonth: currentMonth(get().data, todayISO()),
        updatedAt: nowISO()
      }
      apply((d) => m.addFixedExpense(d, fixed))
    },

    updateFixedExpense(fixed) {
      apply((d) => m.editFixedExpense(d, fixed, currentMonth(d, todayISO()), newId()))
    },

    deleteFixedExpense(id) {
      apply((d) => m.deleteFixedExpense(d, id, currentMonth(d, todayISO())))
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
