// Logic of the Profile (v3 §7.9), shared by Playfull and Pro.
import { useNavigate } from 'react-router'
import { addMonths, formatMonthName, formatMonthShort, formatMonthYear, todayISO } from '../data/dates'
import { formatEuroShort } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'

export function useProfile() {
  const data = useBudj((s) => s.data)
  const openDialog = useUi((s) => s.openDialog)
  const navigate = useNavigate()
  const today = todayISO()
  const month = sel.currentMonth(data, today)
  const settings = data.settings
  const since = sel.budgetMonth(data, settings.createdAt.slice(0, 10))
  const history = sel.goalHistory(data, today, 6)
  const goal = sel.savingsGoal(data, month)

  return {
    firstName: settings.firstName || 'Toi',
    initial: (settings.firstName.trim() || 'B').charAt(0).toUpperCase(),
    avatarColor: settings.avatarColor,
    since: formatMonthYear(since).toLocaleLowerCase('fr-FR'),
    sinceMonth: formatMonthName(since),
    saved: sel.savedSinceStart(data, today),
    goal,
    hits: sel.goalHitCount(data, today, 6),
    history: history.map((h) => ({ ...h, label: formatMonthShort(h.month) })),
    /** Months still to come, so the chart always shows 6 columns. */
    upcoming: Array.from({ length: Math.max(0, 6 - history.length) }, (_, i) =>
      addMonths(history.at(-1)?.month ?? addMonths(month, -1), i + 1)
    ).map((m) => ({ month: m, label: formatMonthShort(m) })),
    summary: sel.profileSummary(data, today),
    budget: {
      monthly: formatEuroShort(sel.monthBudget(data, month)),
      goal: goal > 0 ? `${formatEuroShort(goal)} / mois` : 'Aucun',
      start: settings.monthStartDay === 1 ? 'Le 1er' : `Le ${settings.monthStartDay}`,
      rollover: settings.rolloverRemaining ? 'Vers l’épargne' : 'Désactivé'
    },
    actions: {
      settings: () => navigate('/reglages'),
      editBudget: () => openDialog({ kind: 'budget' }),
      editGoal: () => openDialog({ kind: 'savingsGoal' }),
      editStart: () => openDialog({ kind: 'monthStart' }),
      editRollover: () => openDialog({ kind: 'rollover' }),
      editIdentity: () => openDialog({ kind: 'identity' })
    }
  }
}
