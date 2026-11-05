import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Expense, FixedExpense } from '../shared/types'
import { categoryPaint } from '../data/colors'
import { addMonths, formatLongDay, formatMonthName } from '../data/dates'
import { initialOf, PAYMENT_LABELS } from '../data/format'
import { formatEuro } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { Avatar } from '../components/Avatar'
import { CategoryChip } from '../components/Chip'
import { Dialog } from '../components/Dialog'
import { EmptyState } from '../components/EmptyState'
import { ExpenseRow } from '../components/ExpenseRow'
import { Icon } from '../components/Icon'
import { MonthPicker } from '../components/MonthPicker'
import { Text } from '../components/Text'
import { TrendBadge } from '../components/TrendBadge'
import { MobilePage } from '../layout/Page'
import styles from './Mobile.module.css'

const FIXED_COLOR = 'var(--bg-accent)'
const UNCATEGORIZED_COLOR = 'var(--bg-brand-strong)'

type Entry =
  | { kind: 'expense'; date: string; amount: number; expense: Expense }
  | { kind: 'fixed'; date: string; amount: number; fixed: FixedExpense }

interface HistoryMobileProps {
  month: string
  today: string
  onMonth(month: string): void
  /** Detail panel of an expense, rendered in a sheet. */
  panel(expense: Expense, close: () => void): ReactNode
}

/** Figma: Historique (235:1651). */
export function HistoryMobile({
  month,
  today,
  onMonth,
  panel
}: HistoryMobileProps): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const openDialog = useUi((s) => s.openDialog)
  const [filter, setFilter] = useState<sel.HistoryFilter>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const breakdown = sel.spendingBreakdown(data, month, today)
  const trend = sel.spendingTrend(data, month, today)
  const uncategorized = sel.uncategorizedCount(data, month)
  const activeFilter = filter === 'none' && uncategorized === 0 ? null : filter
  const categoryOf = (id: string | null) => data.categories.find((c) => c.id === id)
  const subName = (id: string): string =>
    data.fixedSubcategories.find((s) => s.id === id)?.name ?? 'Autres'

  const shareLabel = (key: string): [string, string] => {
    if (key === 'fixed') return ['Fixes', FIXED_COLOR]
    if (key === 'none') return ['Sans catégorie', UNCATEGORIZED_COLOR]
    const category = categoryOf(key)
    return [category?.name ?? '', category ? categoryPaint(category).fg : UNCATEGORIZED_COLOR]
  }

  const entries: Entry[] = [
    ...sel
      .filterExpenses(sel.expensesOfMonth(data, month), '', activeFilter)
      .map((expense): Entry => ({
        kind: 'expense',
        date: expense.date,
        amount: expense.amount,
        expense
      })),
    ...(activeFilter === null
      ? sel
          .paidFixedEntries(data, month, today)
          .map(({ fixed, date }): Entry => ({ kind: 'fixed', date, amount: fixed.amount, fixed }))
      : [])
  ]
  const days = [...new Set(entries.map((e) => e.date))].sort().reverse()
  const opened = data.expenses.find((e) => e.id === openId)

  return (
    <MobilePage>
      <header className={styles.headerRow}>
        <Text variant="h1" as="h1">
          Historique
        </Text>
        <MonthPicker value={month} months={sel.availableMonths(data, today)} onChange={onMonth} />
      </header>

      <div className={styles.resume}>
        <Text variant="label-regular" color="secondary">
          Dépensé en {formatMonthName(month)}
        </Text>
        <div className={styles.amountLine}>
          <Text variant="display-m" tabular className={styles.amount}>
            {formatEuro(breakdown.total)}
          </Text>
          {trend !== null && (
            <TrendBadge
              tone={trend < 0 ? 'positive' : trend > 0 ? 'negative' : 'neutral'}
              direction={trend < 0 ? 'down' : trend > 0 ? 'up' : 'flat'}
              label={`${trend > 0 ? '+' : trend < 0 ? '−' : ''}${Math.abs(trend)} % vs ${formatMonthName(addMonths(month, -1))}`}
            />
          )}
        </div>

        {breakdown.shares.length > 0 && (
          <>
            <div className={styles.shareBar} aria-hidden="true">
              {breakdown.shares.map((s) => (
                <span
                  key={s.key}
                  style={
                    {
                      flexGrow: s.amount,
                      background: shareLabel(s.key)[1]
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <div className={styles.shareLegend}>
              {breakdown.shares.map((s) => {
                const [label, color] = shareLabel(s.key)
                return (
                  <span key={s.key} className={styles.shareItem}>
                    <span className={styles.shareDot} style={{ background: color }} />
                    <Text variant="label-regular" color="secondary" as="span" tabular>
                      {label} {Math.round(s.ratio * 100)} %
                    </Text>
                  </span>
                )
              })}
            </div>
          </>
        )}
      </div>

      {uncategorized > 0 && (
        <button
          type="button"
          className={styles.banner}
          onClick={() => setFilter(activeFilter === 'none' ? null : 'none')}
        >
          <Icon name="move" size={20} />
          <Text variant="body-medium" as="span" className={styles.bannerText}>
            {uncategorized} {uncategorized > 1 ? 'dépenses' : 'dépense'} à catégoriser
          </Text>
          <Text variant="body-medium" color="brand" as="span">
            {activeFilter === 'none' ? 'Tout voir' : 'Ranger'}
          </Text>
          <Icon name="chevron" size={16} />
        </button>
      )}

      <div className={styles.chipScroll} role="group" aria-label="Filtrer par catégorie">
        <CategoryChip
          label="Toutes"
          color="bleu"
          selected={activeFilter === null}
          onClick={() => setFilter(null)}
        />
        {data.categories.map((c) => (
          <CategoryChip
            key={c.id}
            label={c.name}
            color={categoryPaint(c)}
            selected={activeFilter === c.id}
            onClick={() => setFilter(activeFilter === c.id ? null : c.id)}
          />
        ))}
      </div>

      {days.length === 0 && (
        <EmptyState
          title="Aucune dépense ce mois-ci"
          message="Ajoute ta première dépense pour la retrouver ici."
          actionLabel="Nouvelle dépense"
          onAction={() => openDialog({ kind: 'expense' })}
        />
      )}

      {days.map((day) => {
        const ofDay = entries.filter((e) => e.date === day)
        return (
          <section key={day} className={styles.group} aria-label={formatLongDay(day)}>
            <div className={styles.spread}>
              <Text variant="h3" as="h2">
                {formatLongDay(day)}
              </Text>
              <Text variant="body-regular" color="brand-faint" as="span" tabular>
                {formatEuro(-ofDay.reduce((a, e) => a + e.amount, 0))}
              </Text>
            </div>
            <div className={styles.groupList}>
              {ofDay.map((entry) => {
                if (entry.kind === 'fixed') {
                  const { fixed } = entry
                  return (
                    <ExpenseRow
                      key={`fixed-${fixed.id}`}
                      label={fixed.label}
                      detail={`Dépense fixe · ${subName(fixed.subcategoryId)}`}
                      amount={formatEuro(-fixed.amount)}
                      amountColor="text-brand"
                      avatar={<Avatar color="bleu" initial={initialOf(fixed.label)} />}
                      onClick={() => openDialog({ kind: 'fixed', fixed })}
                    />
                  )
                }
                const { expense } = entry
                const category = categoryOf(expense.categoryId)
                const detail = [
                  category?.name ?? 'À catégoriser',
                  expense.paymentMethod && PAYMENT_LABELS[expense.paymentMethod]
                ]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <ExpenseRow
                    key={expense.id}
                    label={expense.label}
                    detail={detail}
                    detailColor={category ? undefined : 'text-brand'}
                    amount={formatEuro(-expense.amount)}
                    amountColor={category ? categoryPaint(category).fg : 'text-primary'}
                    avatar={
                      <Avatar
                        color={category ? categoryPaint(category) : 'uncategorized'}
                        initial={category ? initialOf(expense.label) : '?'}
                      />
                    }
                    onClick={() => setOpenId(expense.id)}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      {opened && (
        <Dialog title="Détail de la dépense" onClose={() => setOpenId(null)}>
          {panel(opened, () => setOpenId(null))}
        </Dialog>
      )}
    </MobilePage>
  )
}
