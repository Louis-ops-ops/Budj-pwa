// Logic of the Budget screen (v3 §7.3), shared by Playfull and Pro.
import { useNavigate } from 'react-router'
import type { Paint } from '../data/colors'
import { categoryPaint } from '../data/colors'
import { formatMonthName, todayISO } from '../data/dates'
import { formatEuroShort } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'

export interface AllocationLine {
  key: string
  name: string
  initial: string
  paint: Paint
  amount: number
  /** Share of the monthly budget, 0–1. */
  share: number
  detail: string
  onClick?(): void
}

const FIXED_PAINT: Paint = { bg: 'var(--category-bleu-bg)', fg: 'var(--category-bleu-fg)' }
const SAVINGS_PAINT: Paint = { bg: 'var(--feedback-success-bg)', fg: 'var(--feedback-success-fg)' }

export function useBudgetScreen() {
  const data = useBudj((s) => s.data)
  const openDialog = useUi((s) => s.openDialog)
  const navigate = useNavigate()
  const today = todayISO()
  const month = sel.currentMonth(data, today)
  const breakdown = sel.budgetBreakdown(data, month)
  const share = (amount: number): number => (breakdown.budget > 0 ? amount / breakdown.budget : 0)
  const subCount = sel.fixedGroups(data, month).length

  const lines: AllocationLine[] = [
    {
      key: 'fixed',
      name: 'Dépenses fixes',
      initial: 'F',
      paint: FIXED_PAINT,
      amount: breakdown.fixed,
      share: share(breakdown.fixed),
      detail: `${subCount} sous-catégorie${subCount > 1 ? 's' : ''}`,
      onClick: () => navigate('/fixes')
    },
    {
      key: 'savings',
      name: 'Épargne',
      initial: '€',
      paint: SAVINGS_PAINT,
      amount: breakdown.savings,
      share: share(breakdown.savings),
      detail: breakdown.savings > 0 ? 'Réservée dès le 1er' : 'Aucun objectif',
      onClick: () => openDialog({ kind: 'savingsGoal' })
    },
    ...sel.orderedCategories(data).map((c) => ({
      key: c.id,
      name: c.name,
      initial: c.name,
      paint: categoryPaint(c),
      amount: c.monthlyBudget,
      share: share(c.monthlyBudget),
      detail: `${formatEuroShort(sel.categorySpent(data, month, c.id))} dépensés`,
      onClick: () => navigate(`/categories/${c.id}`)
    }))
  ]

  const startDay = data.settings.monthStartDay

  return {
    monthName: formatMonthName(month),
    breakdown,
    allocated: breakdown.budget - breakdown.toAllocate,
    postCount: data.categories.length,
    lines,
    /** Segments of the repartition bar (fixed, savings, then each category). */
    segments: lines.filter((l) => l.amount > 0).map((l) => ({ key: l.key, value: l.amount, color: l.paint.fg })),
    options: {
      goal: breakdown.savings > 0 ? `${formatEuroShort(breakdown.savings)} / mois` : 'Aucun',
      start: startDay === 1 ? 'Le 1er' : `Le ${startDay}`,
      rollover: data.settings.rolloverRemaining ? 'Vers l’épargne' : 'Désactivé'
    },
    actions: {
      back: () => navigate(-1),
      editBudget: () => openDialog({ kind: 'budget' }),
      newCategory: () => openDialog({ kind: 'newCategory' }),
      editGoal: () => openDialog({ kind: 'savingsGoal' }),
      editStart: () => openDialog({ kind: 'monthStart' }),
      editRollover: () => openDialog({ kind: 'rollover' })
    }
  }
}
