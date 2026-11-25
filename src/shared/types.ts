// Data model. Budj Desktop exports are schema v1, migrate() brings them to v3.
// Amounts are integer cents. Days are YYYY-MM-DD, months YYYY-MM.

export type CategoryColor = 'vert' | 'mauve' | 'orange' | 'rouge' | 'cyan'
export type PaymentMethod = 'card' | 'applePay' | 'cash' | 'transfer' | 'other'
export type ThemeSetting = 'system' | 'light' | 'dark'
export type UiStyle = 'playfull' | 'pro'
export type AvatarColor = 'bleu' | CategoryColor

export const CATEGORY_COLORS: CategoryColor[] = ['vert', 'mauve', 'orange', 'rouge', 'cyan']
export const PAYMENT_METHODS: PaymentMethod[] = ['card', 'applePay', 'cash', 'transfer', 'other']

export interface BudgetPeriod {
  fromMonth: string
  amount: number
  /** Savings goal of the period, reserved from the 1st like a fixed expense (cents). */
  savingsGoal: number
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: CategoryColor
  /** Custom hue (0–359), overrides the preset color when set. */
  customHue?: number
  monthlyBudget: number
  /** Position in lists (Gérer les catégories › Réorganiser). */
  order: number
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

export interface Reminders {
  evening: boolean
  /** HH:MM */
  eveningTime: string
  chargeEve: boolean
  budgetAlert80: boolean
}

export const UI_STYLES: UiStyle[] = ['playfull', 'pro']
export const AVATAR_COLORS: AvatarColor[] = ['bleu', ...CATEGORY_COLORS]

/** User settings that travel with the data (export / import). The theme stays apart (§4). */
export interface Settings {
  uiStyle: UiStyle
  firstName: string
  avatarColor: AvatarColor
  /** First day of the budget month, 1–28. */
  monthStartDay: number
  /** A month's leftover counts as savings (Louis, v3 §6). */
  rolloverRemaining: boolean
  showCents: boolean
  currency: 'EUR'
  reminders: Reminders
  onboardingCompletedAt?: string
  /** ISO, « Sur Budj depuis … » */
  createdAt: string
}

export interface BudjData {
  schemaVersion: 3
  onboardingDone: boolean
  settings: Settings
  budgetHistory: BudgetPeriod[]
  categories: Category[]
  fixedSubcategories: FixedSubcategory[]
  fixedExpenses: FixedExpense[]
  expenses: Expense[]
}
