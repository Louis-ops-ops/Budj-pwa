import type { ComponentType } from 'react'

/** Screens and app chrome that each UI style draws its own way (v3 §3). */
export type ScreenName =
  | 'TabBar'
  | 'MyBudget'
  | 'CategoryDetail'
  | 'FixedExpenses'
  | 'FixedCalendar'
  | 'History'
  | 'Evolution'
  | 'Budget'
  | 'ManageCategories'
  | 'Profile'
  | 'Settings'
  | 'Onboarding'

export interface StyleModule {
  // Props differ per screen: each screen reads its own params.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  screens: Partial<Record<ScreenName, ComponentType<any>>>
}
