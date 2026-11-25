import { useState } from 'react'
import { useLocation } from 'react-router'
import type { Expense, FixedExpense } from '../../../shared/types'
import { categoryPaint, type Paint } from '../../../data/colors'
import { formatLongDay, formatMonthName, todayISO } from '../../../data/dates'
import { PAYMENT_LABELS } from '../../../data/format'
import { formatEuro, formatEuroFloor } from '../../../data/money'
import * as sel from '../../../data/selectors'
import { useBudj } from '../../../data/store'
import { useUi } from '../../../ui/uiStore'
import { Avatar } from '../../../components/Avatar'
import { CategoryChip } from '../../../components/Chip'
import { Icon } from '../../../components/Icon'
import { Text } from '../../../components/Text'
import { Row } from '../../shared/List'
import { ProCard, ProHero, ProNote } from '../components/ProBlocks'
import { ProPage, ProSection } from '../components/ProPage'
import { TabTopBar } from '../components/ProTopBar'
import styles from './History.module.css'

type Entry =
  | { kind: 'expense'; date: string; amount: number; expense: Expense }
  | { kind: 'fixed'; date: string; amount: number; fixed: FixedExpense }

const FIXED: Paint = { bg: 'var(--category-bleu-bg)', fg: 'var(--category-bleu-fg)' }

/** Figma: UI - Pro › 08 · Historique (384:12596). */
export function History(): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const month = useUi((s) => s.month)
  const setMonth = useUi((s) => s.setMonth)
  const openDialog = useUi((s) => s.openDialog)
  const initialFilter = (useLocation().state as { filter?: sel.HistoryFilter } | null)?.filter
  const [filter, setFilter] = useState<sel.HistoryFilter>(initialFilter ?? null)

  const today = todayISO()
  const current = sel.currentMonth(data, today)
  const breakdown = sel.spendingBreakdown(data, month, today)
  const trend = sel.spendingTrend(data, month, today)
  const toSort = sel.uncategorizedCount(data, month)
  const categoryOf = (id: string | null) => data.categories.find((c) => c.id === id)

  const entries: Entry[] = [
    ...sel
      .filterExpenses(sel.expensesOfMonth(data, month), '', filter)
      .map((expense) => ({ kind: 'expense' as const, date: expense.date, amount: expense.amount, expense })),
    ...(filter === null
      ? sel.paidFixedEntries(data, month, today).map((e) => ({
          kind: 'fixed' as const,
          date: e.date,
          amount: e.fixed.amount,
          fixed: e.fixed
        }))
      : [])
  ].sort((a, b) => b.date.localeCompare(a.date))
  const days = [...new Set(entries.map((e) => e.date))]

  return (
    <ProPage hero="history" label="Historique">
      <TabTopBar month={month} months={sel.availableMonths(data, today)} onMonth={setMonth} />
      <ProHero
        label={`Dépensé en ${formatMonthName(month)}`}
        cents={breakdown.total}
        sub={
          trend !== null && (
            <ProNote tone={trend <= 0 ? 'success' : 'danger'}>
              {trend > 0 ? '+' : trend < 0 ? '−' : ''}
              {Math.abs(trend)} % vs mois précédent
            </ProNote>
          )
        }
      />

      <ProSection>
        {toSort > 0 && (
          <button
            type="button"
            className={styles.banner}
            onClick={() =>
              month === current
                ? openDialog({ kind: 'sortUncategorized' })
                : setFilter(filter === 'none' ? null : 'none')
            }
          >
            <Icon name="move" size={20} />
            <Text variant="body-medium" as="span" className={styles.grow}>
              {toSort} dépense{toSort > 1 ? 's' : ''} à catégoriser
            </Text>
            <Text variant="body-medium" color="brand" as="span">
              Ranger
            </Text>
          </button>
        )}

        <div className={styles.chips} role="group" aria-label="Filtrer par catégorie">
          <CategoryChip label="Toutes" color="bleu" selected={filter === null} onClick={() => setFilter(null)} />
          {sel.orderedCategories(data).map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              color={categoryPaint(c)}
              selected={filter === c.id}
              onClick={() => setFilter(filter === c.id ? null : c.id)}
            />
          ))}
        </div>

        {days.length === 0 && (
          <ProCard label="Aucune dépense">
            <div className={styles.empty}>
              <Text variant="h3" as="p">
                Aucune dépense ce mois-ci
              </Text>
              <Text variant="label-regular" color="secondary" as="p">
                Touche le bouton + pour noter ta première dépense.
              </Text>
            </div>
          </ProCard>
        )}

        {days.map((day) => {
          const ofDay = entries.filter((e) => e.date === day)
          const total = ofDay.reduce((a, e) => a + e.amount, 0)
          return (
            <ProCard key={day} title={formatLongDay(day)} count={formatEuroFloor(total)}>
              {ofDay.map((e) => {
                if (e.kind === 'fixed') {
                  return (
                    <Row
                      key={`f-${e.fixed.id}`}
                      leading={<Avatar color={FIXED} initial={e.fixed.label} />}
                      title={e.fixed.label}
                      subtitle="Dépense fixe · prélevée"
                      trailing={`−${formatEuro(e.amount)}`}
                    />
                  )
                }
                const category = categoryOf(e.expense.categoryId)
                return (
                  <Row
                    key={e.expense.id}
                    leading={
                      <Avatar
                        color={category ? categoryPaint(category) : 'uncategorized'}
                        initial={e.expense.label}
                      />
                    }
                    title={e.expense.label || 'Dépense'}
                    subtitle={[
                      category?.name ?? 'À catégoriser',
                      e.expense.paymentMethod ? PAYMENT_LABELS[e.expense.paymentMethod] : null
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    trailing={`−${formatEuro(e.amount)}`}
                    onClick={() => openDialog({ kind: 'expense', expense: e.expense })}
                  />
                )
              })}
            </ProCard>
          )
        })}
      </ProSection>
    </ProPage>
  )
}
