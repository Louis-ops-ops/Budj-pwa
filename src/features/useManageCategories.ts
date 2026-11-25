// Logic of Gérer les catégories (v3 §7.11), shared by Playfull and Pro.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { todayISO } from '../data/dates'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'

export function useManageCategories() {
  const data = useBudj((s) => s.data)
  const reorderCategories = useBudj((s) => s.reorderCategories)
  const openDialog = useUi((s) => s.openDialog)
  const navigate = useNavigate()
  const [reordering, setReordering] = useState(false)

  const today = todayISO()
  const month = sel.currentMonth(data, today)
  const categories = sel.orderedCategories(data)
  const breakdown = sel.budgetBreakdown(data, month)
  const goal = breakdown.savings
  const status = sel.savingsStatus(data, month)

  /** Moves a category one place up (-1) or down (+1). */
  const move = (id: string, direction: -1 | 1): void => {
    const ids = categories.map((c) => c.id)
    const from = ids.indexOf(id)
    const to = from + direction
    if (from < 0 || to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    reorderCategories(ids)
  }

  return {
    categories,
    breakdown,
    allocated: breakdown.budget - breakdown.toAllocate,
    savings:
      goal > 0
        ? {
            goal,
            expected: Math.max(0, goal - status.shortfall),
            status: status.status,
            shortfall: status.shortfall
          }
        : null,
    fixedTotal: breakdown.fixed,
    fixedGroups: sel.fixedGroups(data, month),
    reordering,
    actions: {
      back: () => navigate(-1),
      toggleReorder: () => setReordering(!reordering),
      move,
      remove: (categoryId: string) => openDialog({ kind: 'deleteCategory', categoryId }),
      open: (categoryId: string) => navigate(`/categories/${categoryId}`),
      newCategory: () => openDialog({ kind: 'newCategory' }),
      editGoal: () => openDialog({ kind: 'savingsGoal' }),
      openFixed: () => navigate('/fixes')
    }
  }
}
