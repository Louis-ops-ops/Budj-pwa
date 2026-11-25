// Logic of Mon budget, shared by the Playfull and Pro screens (v3 §7.2).
import { useNavigate } from 'react-router'
import { todayISO } from '../data/dates'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'

export interface SavingsCard {
  goal: number
  /** Expected at the end of the month: the goal, minus what the overspending eats. */
  expected: number
  status: 'onTrack' | 'atRisk'
  shortfall: number
}

export function useHome() {
  const data = useBudj((s) => s.data)
  const openDialog = useUi((s) => s.openDialog)
  const navigate = useNavigate()

  const today = todayISO()
  const month = sel.currentMonth(data, today)
  const statuses = sel.categoryStatuses(data, month)
  const goal = sel.savingsGoal(data, month)
  const status = sel.savingsStatus(data, month)

  const savings: SavingsCard | null =
    goal > 0
      ? {
          goal,
          expected: Math.max(0, goal - status.shortfall),
          status: status.status,
          shortfall: status.shortfall
        }
      : null

  return {
    data,
    today,
    month,
    budget: sel.monthBudget(data, month),
    remaining: sel.globalRemaining(data, month),
    pace: sel.dailyPace(data, month, today),
    savings,
    statuses,
    onTrack: statuses.filter((s) => !s.over),
    over: statuses.filter((s) => s.over),
    fixedTotal: sel.fixedTotal(data, month),
    fixedPaid: sel.paidFixedTotal(data, month, today),
    nextCharge: sel.upcomingCharges(data, today, 1)[0] ?? null,
    curve: sel.remainingCurve(data, month, today),
    fixedGroups: sel.fixedGroups(data, month),
    uncategorizedTotal: sel.categorySpent(data, month, null),
    uncategorizedCount: sel.uncategorizedCount(data, month),
    actions: {
      openCategory: (id: string) => navigate(`/categories/${id}`),
      openFixed: () => navigate('/fixes'),
      openManage: () => navigate('/categories'),
      openBudget: () => navigate('/budget'),
      openMore: () => openDialog({ kind: 'more' }),
      openSavingsGoal: () => openDialog({ kind: 'savingsGoal' }),
      newCategory: () => openDialog({ kind: 'newCategory' }),
      sortUncategorized: () => openDialog({ kind: 'sortUncategorized' })
    }
  }
}
