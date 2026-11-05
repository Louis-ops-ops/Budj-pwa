import { useNavigate } from 'react-router'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import * as sel from '../data/selectors'
import { formatEuro, formatEuroFloor, formatEuroShort, percent } from '../data/money'
import {
  daysInMonth,
  formatDayMonth,
  formatLongDay,
  formatMonthName,
  formatRelative,
  formatShortDay,
  makeDay,
  monthOf,
  todayISO
} from '../data/dates'
import { AsideColumn, Card, MainColumn, Page, Section } from '../layout/Page'
import { Button } from '../components/Button'
import { CategoryRow } from '../components/CategoryRow'
import { EmptyState } from '../components/EmptyState'
import { StackedGauge } from '../components/Gauge'
import { Icon } from '../components/Icon'
import { MonthPicker } from '../components/MonthPicker'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { UpcomingCharge } from '../components/UpcomingCharge'
import { initialOf } from '../data/format'
import { categoryPaint } from '../data/colors'
import { useIsMobile } from '../ui/useIsMobile'
import { MyBudgetMobile } from './MyBudgetMobile'
import styles from './MyBudget.module.css'

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`

export function MyBudget(): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const month = useUi((s) => s.month)
  const setMonth = useUi((s) => s.setMonth)
  const openDialog = useUi((s) => s.openDialog)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  if (isMobile) return <MyBudgetMobile />

  const today = todayISO()
  const isCurrent = month === monthOf(today)
  const remaining = sel.globalRemaining(data, month)
  const gauge = sel.budgetGauge(data, month)
  const pace = sel.dailyPace(data, month, today)
  const fixed = sel.fixedStatus(data, month, today)
  const statuses = sel.categoryStatuses(data, month)
  const allocated = sel.allocatedBudget(data, month)
  const toAllocate = sel.toAllocate(data, month)
  const upcoming = sel.upcomingCharges(data, today)
  const upcomingThisMonth = upcoming.filter((u) => !u.nextMonth)
  const upcomingSum = upcomingThisMonth.reduce((a, u) => a + u.fixed.amount, 0)
  const lastDay = makeDay(monthOf(today), daysInMonth(monthOf(today)))
  const firstNext = upcoming.findIndex((u) => u.nextMonth)

  const figureLabel =
    remaining < 0
      ? isCurrent
        ? 'Dépassement ce mois-ci'
        : `Dépassement en ${formatMonthName(month)}`
      : isCurrent
        ? 'Il te reste ce mois-ci'
        : `Il te restait en ${formatMonthName(month)}`

  return (
    <Page
      title="Mon budget"
      subtitle={formatLongDay(today)}
      actions={
        <>
          <MonthPicker
            value={month}
            months={sel.availableMonths(data, today)}
            onChange={setMonth}
          />
          <Button
            label="Modifier le budget"
            variant="secondary"
            icon="edit"
            onClick={() => openDialog({ kind: 'budget' })}
          />
        </>
      }
    >
      <MainColumn>
        <Card label="Restant du mois">
          <div className={styles.figure}>
            <Text variant="body-medium" color="brand-faint">
              {figureLabel}
            </Text>
            <div className={styles.amountLine}>
              <Text variant="display-l" color={remaining < 0 ? 'danger' : 'brand'} tabular>
                {formatEuro(Math.abs(remaining))}
              </Text>
              <Text variant="h3" color="brand-faint" tabular>
                sur {formatEuroShort(gauge.budget)}
              </Text>
            </div>
            {pace !== null && (
              <div className={styles.pace}>
                <Icon name="clock" size={16} />
                <Text variant="body-medium" tabular>
                  Soit {formatEuroFloor(pace)} par jour jusqu’au {formatDayMonth(lastDay)}
                </Text>
              </div>
            )}
          </div>
          <StackedGauge
            label={`Fixes engagées ${formatEuro(gauge.fixed)}, dépensé ${formatEuro(gauge.spent)}, restant ${formatEuro(gauge.remaining)}`}
            segments={[
              { label: 'fixed', value: gauge.fixed, color: 'bg-accent' },
              { label: 'spent', value: gauge.spent, color: 'border-brand-subtle' },
              { label: 'remaining', value: gauge.remaining, color: 'bg-brand-muted' }
            ]}
          />
          <div className={styles.legend}>
            <LegendItem color="bg-accent" label="Fixes engagées" value={gauge.fixed} />
            <LegendItem color="border-brand-subtle" label="Dépensé" value={gauge.spent} />
            <LegendItem color="bg-brand-muted" label="Restant" value={gauge.remaining} />
          </div>
        </Card>

        <Section
          title="Mes catégories"
          subtitle={`${formatEuro(allocated)} répartis · ${formatEuro(Math.abs(toAllocate))} ${toAllocate >= 0 ? 'encore à répartir' : 'au-delà du budget'}`}
          actions={
            <TextLink
              label="Nouvelle catégorie"
              icon="add"
              onClick={() => openDialog({ kind: 'newCategory' })}
            />
          }
        >
          <div className={styles.table}>
            <div className={`t-label-medium ${styles.columns}`} aria-hidden="true">
              <span className={styles.colName}>Catégorie</span>
              <span className={styles.colSpent}>Dépensé</span>
              <span className={styles.colRemaining}>Restant</span>
              <span className={styles.colChevron} />
            </div>
            <div className={styles.list}>
              <CategoryRow
                color="bleu"
                name="Dépenses fixes"
                detail={
                  fixed.count > 0
                    ? `${plural(fixed.count, 'prélèvement', 'prélèvements')} · ${formatEuro(fixed.total)}`
                    : 'Aucun prélèvement'
                }
                spentLabel={
                  fixed.count > 0
                    ? `${formatEuro(fixed.paid)} déjà prélevés · ${percent(fixed.ratio)}`
                    : 'Abonnements, loyer, factures…'
                }
                remaining={formatEuro(fixed.upcoming)}
                remainingLabel="à venir"
                ratio={fixed.ratio}
                onClick={() => navigate('/fixes')}
              />
              {statuses.map((s) => (
                <CategoryRow
                  key={s.category.id}
                  color={categoryPaint(s.category)}
                  name={s.category.name}
                  detail={`Budget de ${formatEuroShort(s.budget)}`}
                  spentLabel={
                    s.budget > 0
                      ? `${formatEuro(s.spent)} dépensés · ${percent(s.ratio)}`
                      : `${formatEuro(s.spent)} dépensés`
                  }
                  remaining={formatEuro(Math.abs(s.remaining))}
                  remainingLabel={s.over ? 'de dépassement' : 'restants'}
                  ratio={s.ratio}
                  onClick={() => navigate(`/categories/${s.category.id}`)}
                />
              ))}
            </div>
          </div>
          {statuses.length === 0 && (
            <EmptyState
              title="Aucune catégorie"
              message="Crée des catégories pour répartir ton budget : courses, sorties…"
              actionLabel="Nouvelle catégorie"
              onAction={() => openDialog({ kind: 'newCategory' })}
            />
          )}
        </Section>
      </MainColumn>

      <AsideColumn>
        <Card compact label="Prochains prélèvements">
          <div className={styles.upcomingTitle}>
            <Text variant="h3" as="h2">
              Prochains prélèvements
            </Text>
            <Text variant="label-regular" color="secondary" tabular>
              {upcomingThisMonth.length > 0
                ? `${formatEuro(upcomingSum)} d’ici le ${formatDayMonth(lastDay)}`
                : 'Plus rien ce mois-ci'}
            </Text>
          </div>
          {upcoming.length === 0 && (
            <TextLink
              label="Ajouter une dépense fixe"
              icon="add"
              onClick={() => openDialog({ kind: 'fixed' })}
            />
          )}
          {upcoming.map((u, i) => (
            <div key={`${u.fixed.id}-${u.date}`} className={styles.list}>
              {i === firstNext && (
                <Text variant="label-medium" className={styles.groupLabel}>
                  Début {formatMonthName(monthOf(u.date))}
                </Text>
              )}
              <UpcomingCharge
                highlighted={i === 0}
                name={u.fixed.label}
                initial={initialOf(u.fixed.label)}
                amount={formatEuro(-u.fixed.amount)}
                dueLabel={`${formatShortDay(u.date)} · ${formatRelative(today, u.date)}`}
              />
            </div>
          ))}
          <TextLink
            label="Voir le calendrier des fixes"
            icon="chevron"
            iconPosition="right"
            className={styles.calendarLink}
            onClick={() => navigate('/fixes')}
          />
        </Card>
      </AsideColumn>
    </Page>
  )
}

function LegendItem({
  color,
  label,
  value
}: {
  color: string
  label: string
  value: number
}): React.JSX.Element {
  return (
    <div className={styles.legendItem}>
      <span
        className={styles.legendDot}
        style={{ background: `var(--${color})` }}
        aria-hidden="true"
      />
      <Text variant="label-regular" color="tertiary" as="span">
        {label}
      </Text>
      <Text variant="label-bold" color="primary" as="span" tabular>
        {formatEuro(value)}
      </Text>
    </div>
  )
}
