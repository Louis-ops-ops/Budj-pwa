// Data model. Budj Desktop exports are schema v1, migrate() brings them to v2.
// Amounts are integer cents. Days are YYYY-MM-DD, months YYYY-MM.

export type CategoryColor = 'vert' | 'mauve' | 'orange' | 'rouge' | 'cyan'
export type PaymentMethod = 'card' | 'applePay' | 'cash' | 'transfer' | 'other'
export type ThemeSetting = 'system' | 'light' | 'dark'

export const CATEGORY_COLORS: CategoryColor[] = ['vert', 'mauve', 'orange', 'rouge', 'cyan']
export const PAYMENT_METHODS: PaymentMethod[] = ['card', 'applePay', 'cash', 'transfer', 'other']

export interface BudgetPeriod {
  fromMonth: string
  amount: number
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: CategoryColor
  /** Custom hue (0–359), overrides the preset color when set. */
  customHue?: number
  monthlyBudget: number
  createdAt: string
  updatedAt: string
}

export interface FixedSubcategory {
  id: string
  name: string
  updatedAt: string
}

export interface FixedExpense {
  id: string
  label: string
  amount: number
  dayOfMonth: number
  subcategoryId: string
  startMonth: string
  endMonth?: string
  updatedAt: string
}

export interface Expense {
  id: string
  amount: number
  label: string
  categoryId: string | null
  date: string
  paymentMethod?: PaymentMethod
  updatedAt: string
}

export interface BudjData {
  schemaVersion: 2
  onboardingDone: boolean
  budgetHistory: BudgetPeriod[]
  categories: Category[]
  fixedSubcategories: FixedSubcategory[]
  fixedExpenses: FixedExpense[]
  expenses: Expense[]
}
