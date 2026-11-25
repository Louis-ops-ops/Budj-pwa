// In-app reminders (v3 §7.13). A PWA cannot schedule local notifications on
// iOS: Budj says it when it opens, once a day at most per kind.
import type { BudjData } from '../shared/types'
import { addDays } from './dates'
import * as sel from './selectors'

export type ReminderKind = 'evening' | 'chargeEve'

export interface Reminder {
  kind: ReminderKind
  message: string
}

/** Last day each kind was shown (meta.lastSeenReminders). */
export type SeenReminders = Partial<Record<ReminderKind, string>>

/** Reminders due now. `time` is the local HH:MM. */
export function dueReminders(
  data: BudjData,
  today: string,
  time: string,
  seen: SeenReminders
): Reminder[] {
  const { reminders } = data.settings
  const out: Reminder[] = []
  if (!data.onboardingDone) return out

  if (
    reminders.evening &&
    seen.evening !== today &&
    time >= reminders.eveningTime &&
    !data.expenses.some((e) => e.date === today)
  ) {
    out.push({ kind: 'evening', message: 'Tu n’as rien noté aujourd’hui' })
  }

  if (reminders.chargeEve && seen.chargeEve !== today) {
    const tomorrow = addDays(today, 1)
    const month = sel.budgetMonth(data, tomorrow)
    const charges = sel
      .activeFixed(data, month)
      .filter((f) => sel.chargeDate(data, f, month) === tomorrow)
    if (charges.length === 1) {
      out.push({ kind: 'chargeEve', message: `${charges[0].label} est prélevé demain` })
    } else if (charges.length > 1) {
      const names = charges.map((f) => f.label)
      out.push({
        kind: 'chargeEve',
        message: `${names.slice(0, -1).join(', ')} et ${names.at(-1)} sont prélevés demain`
      })
    }
  }
  return out
}

/** Categories that cross 80 % of their budget between two states (alert at add time). */
export function crossedBudgetAlert(before: BudjData, after: BudjData, month: string): string[] {
  if (!after.settings.reminders.budgetAlert80) return []
  return after.categories
    .filter((c) => c.monthlyBudget > 0)
    .filter((c) => {
      const was = sel.categorySpent(before, month, c.id) / c.monthlyBudget
      const now = sel.categorySpent(after, month, c.id) / c.monthlyBudget
      return was < 0.8 && now >= 0.8
    })
    .map((c) => `${c.name} : 80 % du budget atteint`)
}
