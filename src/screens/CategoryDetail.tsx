import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Category, Expense } from '../shared/types'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import * as sel from '../data/selectors'
import { formatEuro, formatEuroFloor, formatEuroShort, percent } from '../data/money'
import { PAYMENT_LABELS, formatExpenseDate } from '../data/format'
import {
  daysInMonth,
  formatDayMonth,
  formatMonthName,
  formatMonthShort,
  makeDay,
  monthOf,
  todayISO
} from '../data/dates'
import { AsideColumn, Card, MainColumn, MobilePage, Page, Section } from '../layout/Page'
import { TrendBadge } from '../components/TrendBadge'
import mobile from './Mobile.module.css'
import { useIsMobile } from '../ui/useIsMobile'
import { Button } from '../components/Button'
import { CategoryChip, ChipList } from '../components/Chip'
import { EmptyState } from '../components/EmptyState'
import { ExpenseRow } from '../components/ExpenseRow'
import { Gauge } from '../components/Gauge'
import { Icon } from '../components/Icon'
import { IconButton } from '../components/IconButton'
import { MonthPicker } from '../components/MonthPicker'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { categoryPaint } from '../data/colors'
import styles from './CategoryDetail.module.css'

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`
const MOBILE_PREVIEW = 4

export function CategoryDetail(): React.JSX.Element {
  const { id } = useParams()
  const data = useBudj((s) => s.data)
  const category = data.categories.find((c) => c.id === id)
  const navigate = useNavigate()

  useEffect(() => {
    if (!category) navigate('/', { replace: true })
  }, [category, navigate])

  return category ? <CategoryDetailContent key={category.id} category={category} /> : <></>
}

function CategoryDetailContent({ category }: { category: Category }): React.JSX.Element {
  const isMobile = useIsMobile()
  const data = useBudj((s) => s.data)
  const deleteCategory = useBudj((s) => s.deleteCategory)
  const deleteExpenses = useBudj((s) => s.deleteExpenses)
  const moveExpenses = useBudj((s) => s.moveExpenses)
  const month = useUi((s) => s.month)
  const setMonth = useUi((s) => s.setMonth)
  const openDialog = useUi((s) => s.openDialog)
  const toast = useUi((s) => s.toast)
  const navigate = useNavigate()

  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [target, setTarget] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const today = todayISO()
  const isCurrent = month === monthOf(today)
  const status = sel.categoryStatus(data, month, category)
  const pace = sel.categoryDailyPace(data, month, today, category)
  const expenses = sel.categoryExpenses(data, month, category.id)
  const stats = sel.expenseStats(expenses)
  const history = sel.categoryHistory(data, category, month, today)
  const lastDay = makeDay(month, daysInMonth(month))
  const paint = categoryPaint(category)
  const fg = paint.fg

  const exitSelection = (): void => {
    setSelecting(false)
    setSelected(new Set())
    setTarget(null)
  }

  // Escape leaves the selection mode (dialogs handle their own Escape first).
  useEffect(() => {
    if (!selecting) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && useUi.getState().dialogs.length === 0) exitSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selecting])

  const toggle = (expenseId: string): void =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(expenseId)) next.delete(expenseId)
      else next.add(expenseId)
      return next
    })

  const startMove = (expenseId: string): void => {
    setSelecting(true)
    setSelected(new Set([expenseId]))
  }

  const confirmDeleteExpenses = (ids: string[], label: string): void =>
    openDialog({
      kind: 'confirm',
      title: ids.length > 1 ? `Supprimer ${ids.length} dépenses ?` : 'Supprimer cette dépense ?',
      message: `${label} Cette action est définitive.`,
      confirmLabel: 'Supprimer',
      onConfirm: () => {
        deleteExpenses(ids)
        toast(ids.length > 1 ? `${ids.length} dépenses supprimées` : 'Dépense supprimée')
        exitSelection()
      }
    })

  const confirmDeleteCategory = (): void => {
    const count = data.expenses.filter((e) => e.categoryId === category.id).length
    openDialog({
      kind: 'confirm',
      title: `Supprimer ${category.name} ?`,
      message:
        count > 0
          ? count === 1
            ? 'Sa dépense passera dans « À catégoriser ».'
            : `Ses ${count} dépenses passeront dans « À catégoriser ».`
          : 'Cette catégorie n’a aucune dépense.',
      confirmLabel: 'Supprimer la catégorie',
      onConfirm: () => {
        deleteCategory(category.id)
        toast(`Catégorie « ${category.name} » supprimée`)
        navigate('/')
      }
    })
  }

  const move = (): void => {
    if (!target) return
    const dest = data.categories.find((c) => c.id === target)
    moveExpenses([...selected], target)
    toast(
      `${plural(selected.size, 'dépense déplacée', 'dépenses déplacées')} vers ${dest?.name ?? ''}`
    )
    exitSelection()
  }

  const describe = (e: Expense): string => `${e.label} · ${formatEuro(e.amount)}.`
  const previous = history.length > 1 ? history[history.length - 2] : undefined
  const trend =
    previous && previous.spent > 0
      ? Math.round(((status.spent - previous.spent) / previous.spent) * 100)
      : null
  const scale = Math.max(category.monthlyBudget, ...history.map((h) => h.spent), 1)
  const heroStyle = {
    '--hero-bg': paint.bg,
    '--hero-fg': fg
  } as CSSProperties

  const shown = isMobile && !showAll && !selecting ? expenses.slice(0, MOBILE_PREVIEW) : expenses

  const expenseSection = (
    <Section
      title={
        isMobile && selecting
          ? plural(selected.size, 'dépense sélectionnée', 'dépenses sélectionnées')
          : `Dépenses ${/^[aeiouéè]/i.test(formatMonthName(month)) ? 'd’' : 'de '}${formatMonthName(month)}`
      }
      subtitle={isMobile ? undefined : plural(expenses.length, 'dépense', 'dépenses')}
      actions={
        expenses.length > 0 &&
        (selecting ? (
          <TextLink label="Annuler" onClick={exitSelection} />
        ) : (
          <TextLink label="Sélectionner" onClick={() => setSelecting(true)} />
        ))
      }
    >
      {expenses.length === 0 ? (
        <EmptyState
          title="Aucune dépense ce mois-ci"
          message={`Les dépenses ajoutées dans ${category.name} apparaîtront ici.`}
          actionLabel="Nouvelle dépense"
          onAction={() => openDialog({ kind: 'expense', categoryId: category.id })}
        />
      ) : (
        <div className={styles.table}>
          <div className={`t-label-medium ${styles.head}`} aria-hidden="true">
            {selecting && <span className={styles.headCheck} />}
            <span className={styles.headLabel}>Dépense</span>
            <span className={styles.headDate}>Date</span>
            <span className={styles.headAmount}>Montant</span>
            {!selecting && <span className={styles.headActions} />}
          </div>
          {shown.map((e) => (
            <ExpenseRow
              key={e.id}
              label={e.label}
              detail={
                isMobile
                  ? [
                      formatExpenseDate(e.date, today),
                      e.paymentMethod && PAYMENT_LABELS[e.paymentMethod]
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : e.paymentMethod && PAYMENT_LABELS[e.paymentMethod]
              }
              date={formatExpenseDate(e.date, today)}
              amount={formatEuro(-e.amount)}
              amountColor={fg}
              selectable={selecting}
              selected={selected.has(e.id)}
              onToggle={() => toggle(e.id)}
              onMove={data.categories.length > 1 ? () => startMove(e.id) : undefined}
              onEdit={() => openDialog({ kind: 'expense', expense: e })}
              onDelete={() => confirmDeleteExpenses([e.id], describe(e))}
            />
          ))}
          {selecting && (
            <div
              className={styles.selectionBar}
              role="region"
              aria-label="Actions sur la sélection"
            >
              <div className={styles.selectionTop}>
                <Text variant="body-bold" as="span">
                  {plural(selected.size, 'sélectionnée', 'sélectionnées')}
                </Text>
                <TextLink
                  label={
                    selected.size === expenses.length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'
                  }
                  onClick={() =>
                    setSelected(
                      selected.size === expenses.length
                        ? new Set()
                        : new Set(expenses.map((e) => e.id))
                    )
                  }
                />
              </div>
              {data.categories.length > 1 && (
                <>
                  <Text variant="label-medium" color={isMobile ? 'brand' : 'tertiary'}>
                    Déplacer vers
                  </Text>
                  <ChipList label="Déplacer vers">
                    {data.categories
                      .filter((c) => c.id !== category.id)
                      .map((c) => (
                        <CategoryChip
                          key={c.id}
                          label={c.name}
                          color={categoryPaint(c)}
                          selected={target === c.id}
                          onClick={() => setTarget(target === c.id ? null : c.id)}
                        />
                      ))}
                  </ChipList>
                </>
              )}
              <div className={styles.selectionTop}>
                <TextLink label="Annuler" onClick={exitSelection} />
                <div className={styles.selectionButtons}>
                  <Button
                    label="Supprimer"
                    icon={isMobile ? 'delete' : undefined}
                    variant="secondary"
                    disabled={selected.size === 0}
                    onClick={() =>
                      confirmDeleteExpenses(
                        [...selected],
                        selected.size > 1
                          ? `${selected.size} dépenses de ${category.name}.`
                          : describe(expenses.find((e) => selected.has(e.id))!)
                      )
                    }
                  />
                  <Button
                    label="Déplacer"
                    icon={isMobile ? 'move' : undefined}
                    disabled={selected.size === 0 || !target}
                    onClick={move}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  )

  const openCategoryActions = (): void =>
    openDialog({
      kind: 'actions',
      title: category.name,
      actions: [
        {
          label: 'Modifier le budget',
          icon: 'edit',
          onSelect: () => openDialog({ kind: 'categoryBudget', categoryId: category.id })
        },
        {
          label: 'Modifier la couleur',
          icon: 'categories',
          onSelect: () => openDialog({ kind: 'categoryColor', categoryId: category.id })
        },
        {
          label: 'Supprimer la catégorie',
          icon: 'delete',
          danger: true,
          onSelect: confirmDeleteCategory
        }
      ]
    })

  if (isMobile) {
    return (
      <MobilePage>
        <header className={mobile.headerRow}>
          <IconButton
            icon="chevron"
            iconRotate={180}
            label="Mes catégories"
            onClick={() => navigate('/')}
          />
          <IconButton icon="edit" label="Modifier la catégorie" onClick={openCategoryActions} />
        </header>

        <section className={mobile.hero} style={heroStyle} aria-label="Restant de la catégorie">
          <div className={mobile.headerRow}>
            <Text variant="h1" as="h1">
              {category.name}
            </Text>
            {trend !== null && previous && (
              <TrendBadge
                tone={trend < 0 ? 'positive' : trend > 0 ? 'negative' : 'neutral'}
                direction={trend < 0 ? 'down' : trend > 0 ? 'up' : 'flat'}
                label={`${trend > 0 ? '+' : trend < 0 ? '−' : ''}${Math.abs(trend)} % vs ${formatMonthName(previous.month)}`}
              />
            )}
          </div>
          <div className={mobile.heroFigure}>
            <Text variant="label-regular" className={status.over ? styles.over : undefined}>
              {status.over ? 'Dépassement de' : isCurrent ? 'Il te reste' : 'Il te restait'}
            </Text>
            <div className={mobile.amountLine}>
              <Text
                variant="display-m"
                tabular
                className={[mobile.amount, status.over ? styles.over : ''].join(' ')}
              >
                {formatEuroFloor(Math.abs(status.remaining))}
              </Text>
              <Text variant="h3" tabular>
                sur {formatEuroShort(status.budget)}
              </Text>
            </div>
          </div>
          <div className={mobile.gaugeRow}>
            <Gauge ratio={status.ratio} fill={status.over ? 'bg-danger' : fg} />
            <Text variant="caption-medium" as="span" tabular className={mobile.pct}>
              {percent(status.ratio)}
            </Text>
          </div>
          {pace !== null && (
            <div className={mobile.pace}>
              <Icon name="clock" size={16} />
              <Text variant="label-medium" tabular>
                Soit {formatEuro(pace)} par jour jusqu’au {formatDayMonth(lastDay)}
              </Text>
            </div>
          )}
        </section>

        <div className={mobile.stats}>
          <MobileStat label="Dépensé" value={formatEuroFloor(status.spent)} />
          <MobileStat label="Dépenses" value={String(stats.count)} />
          <MobileStat label="Moyenne" value={formatEuroFloor(stats.average)} />
        </div>

        {expenseSection}

        {shown.length < expenses.length && (
          <TextLink
            label={`Voir les ${expenses.length} dépenses`}
            icon="chevron"
            iconPosition="right"
            className={mobile.settings}
            onClick={() => setShowAll(true)}
          />
        )}
      </MobilePage>
    )
  }

  return (
    <Page
      breadcrumb={
        <button
          type="button"
          className={`t-label-medium ${styles.breadcrumb}`}
          onClick={() => navigate('/')}
        >
          Mes catégories
          <Icon name="chevron" size={16} />
        </button>
      }
      title={category.name}
      subtitle={`Budget de ${formatEuroShort(category.monthlyBudget)} par mois`}
      actions={
        <>
          <MonthPicker
            value={month}
            months={sel.availableMonths(data, today)}
            onChange={setMonth}
          />
          <IconButton
            icon="delete"
            label="Supprimer la catégorie"
            onClick={confirmDeleteCategory}
          />
          <Button
            label="Modifier la couleur"
            variant="secondary"
            onClick={() => openDialog({ kind: 'categoryColor', categoryId: category.id })}
          />
          <Button
            label="Modifier le budget"
            variant="secondary"
            icon="edit"
            onClick={() => openDialog({ kind: 'categoryBudget', categoryId: category.id })}
          />
        </>
      }
    >
      <MainColumn>
        <section className={styles.hero} style={heroStyle} aria-label="Restant de la catégorie">
          <Text variant="body-medium" className={status.over ? styles.over : undefined}>
            {status.over
              ? 'Dépassement de'
              : isCurrent
                ? 'Il te reste'
                : `Il te restait en ${formatMonthName(month)}`}
          </Text>
          <div className={styles.amountLine}>
            <Text variant="display-l" tabular className={status.over ? styles.over : undefined}>
              {formatEuro(Math.abs(status.remaining))}
            </Text>
            <Text variant="h3" tabular>
              sur {formatEuroShort(status.budget)}
            </Text>
          </div>
          {pace !== null && (
            <div className={styles.pace}>
              <Icon name="clock" size={16} />
              <Text variant="body-medium" tabular>
                Soit {formatEuro(pace)} par jour jusqu’au {formatDayMonth(lastDay)}
              </Text>
            </div>
          )}
          <div className={styles.gauge}>
            <Gauge ratio={status.ratio} fill={status.over ? 'bg-danger' : fg} height="strong" />
            <Text variant="label-regular" tabular>
              {formatEuro(status.spent)} dépensés
              {status.budget > 0 && ` · ${percent(status.ratio)} du budget`}
            </Text>
          </div>
        </section>

        {expenseSection}
      </MainColumn>

      <AsideColumn>
        <Card compact label={isCurrent ? 'Ce mois-ci' : formatMonthName(month)}>
          <Text variant="h3" as="h2">
            {isCurrent ? 'Ce mois-ci' : `En ${formatMonthName(month)}`}
          </Text>
          <Stat label="Nombre de dépenses" value={String(stats.count)} />
          <div className={styles.separator} />
          <Stat label="Panier moyen" value={formatEuro(stats.average)} />
          <div className={styles.separator} />
          <Stat label="Plus grosse dépense" value={formatEuro(stats.largest)} />
        </Card>

        <Card compact label="Derniers mois">
          <div className={styles.cardTitle}>
            <Text variant="h3" as="h2">
              {history.length >= 6
                ? '6 derniers mois'
                : history.length > 1
                  ? `${history.length} derniers mois`
                  : 'Historique'}
            </Text>
            {trend !== null && previous && (
              <Text
                variant="label-regular"
                tabular
                className={trend <= 0 ? styles.trendGood : styles.trendBad}
              >
                {trend > 0 ? '+' : trend < 0 ? '−' : ''}
                {Math.abs(trend)} % par rapport à {formatMonthName(previous.month)}
              </Text>
            )}
          </div>
          {history.map((h) => {
            const last = h.month === month
            return (
              <div key={h.month} className={styles.monthRow}>
                <Text
                  variant="label-medium"
                  as="span"
                  className={[styles.monthLabel, last ? styles.monthCurrent : ''].join(' ')}
                >
                  {formatMonthShort(h.month).replace('.', '')}
                </Text>
                <span className={styles.monthTrack} aria-hidden="true">
                  <span
                    className={[styles.monthFill, !last && !h.over ? styles.monthPast : ''].join(
                      ' '
                    )}
                    style={
                      {
                        width: `${Math.min(h.spent / scale, 1) * 100}%`,
                        '--fill': h.over ? 'var(--bg-danger)' : fg
                      } as CSSProperties
                    }
                  />
                </span>
                <Text
                  variant={last ? 'label-bold' : 'label-regular'}
                  as="span"
                  tabular
                  color={h.over ? 'danger' : 'primary'}
                  className={styles.monthAmount}
                >
                  {formatEuroShort(h.spent)}
                </Text>
              </div>
            )
          })}
          <Text variant="caption-medium" className={styles.caption}>
            Budget : {formatEuroShort(category.monthlyBudget)} par mois · {formatMonthName(month)}
            {isCurrent ? ' en cours' : ''}
          </Text>
        </Card>
      </AsideColumn>
    </Page>
  )
}

function MobileStat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className={mobile.stat}>
      <Text variant="label-regular" color="secondary" as="span">
        {label}
      </Text>
      <Text variant="h3" as="span" tabular>
        {value}
      </Text>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className={styles.statRow}>
      <Text variant="label-regular" color="secondary" as="span">
        {label}
      </Text>
      <Text variant="body-bold" as="span" tabular>
        {value}
      </Text>
    </div>
  )
}
