// Logic of the category detail (v3 §7.5): figures, actions and selection mode.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { categoryPaint } from '../data/colors'
import { todayISO } from '../data/dates'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`

export function useCategoryDetail() {
  const { id } = useParams()
  const data = useBudj((s) => s.data)
  const moveExpenses = useBudj((s) => s.moveExpenses)
  const deleteExpenses = useBudj((s) => s.deleteExpenses)
  const openDialog = useUi((s) => s.openDialog)
  const toast = useUi((s) => s.toast)
  const setChromeHidden = useUi((s) => s.setChromeHidden)
  const navigate = useNavigate()
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [target, setTarget] = useState<string | null>(null)

  // The bottom panel replaces the tab bar while selecting.
  useEffect(() => {
    setChromeHidden(selecting)
    return () => setChromeHidden(false)
  }, [selecting, setChromeHidden])

  const category = data.categories.find((c) => c.id === id)
  const today = todayISO()
  const month = sel.currentMonth(data, today)

  const exit = (): void => {
    setSelecting(false)
    setSelected(new Set())
    setTarget(null)
  }

  if (!category) return null

  const expenses = sel.categoryExpenses(data, month, category.id)
  return {
    category,
    paint: categoryPaint(category),
    month,
    today,
    status: sel.categoryStatus(data, month, category),
    stats: sel.categoryStats(data, category, month, today),
    pace: sel.categoryDailyPace(data, month, today, category),
    expenses,
    others: sel.orderedCategories(data).filter((c) => c.id !== category.id),
    selecting,
    selected,
    target,
    actions: {
      back: () => navigate(-1),
      add: () => openDialog({ kind: 'expense', categoryId: category.id }),
      budget: () => openDialog({ kind: 'categoryBudget', categoryId: category.id }),
      edit: () => openDialog({ kind: 'categoryColor', categoryId: category.id }),
      remove: () =>
        openDialog({ kind: 'deleteCategory', categoryId: category.id, onDeleted: () => navigate('/') }),
      openExpense: (expenseId: string) => {
        const expense = expenses.find((e) => e.id === expenseId)
        if (expense) openDialog({ kind: 'expense', expense })
      },
      startSelection: () => setSelecting(true),
      exitSelection: exit,
      toggle: (expenseId: string) =>
        setSelected((prev) => {
          const next = new Set(prev)
          if (next.has(expenseId)) next.delete(expenseId)
          else next.add(expenseId)
          return next
        }),
      setTarget: (categoryId: string) => setTarget(target === categoryId ? null : categoryId),
      move: () => {
        if (!target || selected.size === 0) return
        const dest = data.categories.find((c) => c.id === target)
        moveExpenses([...selected], target)
        toast(`${plural(selected.size, 'dépense déplacée', 'dépenses déplacées')} vers ${dest?.name ?? ''}`)
        exit()
      },
      deleteSelected: () =>
        openDialog({
          kind: 'confirm',
          title:
            selected.size > 1 ? `Supprimer ${selected.size} dépenses ?` : 'Supprimer cette dépense ?',
          message: 'Cette action est définitive.',
          confirmLabel: 'Supprimer',
          onConfirm: () => {
            deleteExpenses([...selected])
            toast(selected.size > 1 ? `${selected.size} dépenses supprimées` : 'Dépense supprimée')
            exit()
          }
        })
    }
  }
}
