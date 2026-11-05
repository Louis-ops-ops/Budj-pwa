import { create } from 'zustand'
import type { IconName } from '../components/Icon'
import type { Expense, FixedExpense } from '../shared/types'
import { monthOf, todayISO } from '../data/dates'

export interface RowAction {
  label: string
  icon: IconName
  danger?: boolean
  onSelect(): void
}

export type DialogRequest =
  | { kind: 'expense'; categoryId?: string | null; expense?: Expense }
  | { kind: 'budget' }
  | { kind: 'categoryBudget'; categoryId: string }
  | { kind: 'categoryColor'; categoryId: string }
  | { kind: 'newCategory'; onCreated?: (categoryId: string) => void }
  | { kind: 'fixed'; fixed?: FixedExpense; dayOfMonth?: number }
  | { kind: 'newSubcategory'; onCreated?: (subcategoryId: string) => void }
  | {
      kind: 'confirm'
      title: string
      message: string
      confirmLabel: string
      onConfirm: () => void
    }
  | { kind: 'settings' }
  | { kind: 'actions'; title: string; actions: RowAction[] }

export type DialogEntry = DialogRequest & { id: number }

interface Toast {
  id: number
  message: string
}

interface UiState {
  dialogs: DialogEntry[]
  toasts: Toast[]
  /** Month shown on screens with a month picker. */
  month: string
  openDialog(request: DialogRequest): void
  closeDialog(id: number): void
  toast(message: string): void
  setMonth(month: string): void
}

let nextId = 1
const TOAST_MS = 3000

export const useUi = create<UiState>()((set, get) => ({
  dialogs: [],
  toasts: [],
  month: monthOf(todayISO()),

  openDialog(request) {
    set({ dialogs: [...get().dialogs, { ...request, id: nextId++ } as DialogEntry] })
  },

  closeDialog(id) {
    set({ dialogs: get().dialogs.filter((d) => d.id !== id) })
  },

  toast(message) {
    const id = nextId++
    set({ toasts: [...get().toasts, { id, message }] })
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), TOAST_MS)
  },

  setMonth(month) {
    set({ month })
  }
}))
