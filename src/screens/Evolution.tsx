import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import * as sel from '../data/selectors'
import { formatEuro, formatEuroShort, percent } from '../data/money'
import {
  addMonths,
  daysInMonth,
  dayNumber,
  formatDayMonth,
  formatMonthName,
  makeDay,
  monthOf,
  todayISO
} from '../data/dates'
import { AsideColumn, Card, MainColumn, Page, Section } from '../layout/Page'
import { EmptyState } from '../components/EmptyState'
import { Gauge } from '../components/Gauge'
import { SavingsChart } from '../components/SavingsChart'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { TrendBadge } from '../components/TrendBadge'
import { categoryPaint, cssColor } from '../data/colors'
import { useIsMobile } from '../ui/useIsMobile'
import { EvolutionMobile, MonthDetailMobile } from './EvolutionMobile'
import styles from './Evolution.module.css'

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** Badge for a spending difference: spending less is good. */
function spendingBadge(delta: number): React.JSX.Element {
  if (delta === 0) return <TrendBadge tone="neutral" direction="flat" label="Stable" />
  const sign = delta > 0 ? '+' : '−'
  return (
    <TrendBadge
      tone={delta < 0 ? 'positive' : 'negative'}
      direction={delta < 0 ? 'down' : 'up'}
      label={`${sign}${formatEuroShort(Math.abs(Math.round(delta / 100) * 100))}`}
    />
  )
}

export function Evolution(): React.JSX.Element {
  const isMobile = useIsMobile()
  const { month } = useParams()
  if (isMobile) return month ? <MonthDetailMobile month={month} /> : <EvolutionMobile />
  return <EvolutionDesktop />
}

function EvolutionDesktop(): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const setMonth = useUi((s) => s.setMonth)
  const navigate = useNavigate()
  const today = todayISO()
  const current = monthOf(today)

  const series = sel.savingsSeries(data, today)
  const [picked, setPicked] = useState<string | null>(null)
  const selected = series.find((m) => m.month === picked) ?? series[series.length - 1]
  const summary = sel.yearSummary(data, today)

  // Current month card.
  const budget = sel.monthBudget(data, current)
  const engaged = sel.monthSpent(data, current)
  const remaining = sel.globalRemaining(data, current)
  const daysLeft = daysInMonth(current) - dayNumber(today) + 1

  const currentCard = (
    <Card compact label={`${capitalize(formatMonthName(current))} en cours`}>
      <div className={styles.cardHead}>
        <Text variant="h3" as="h2">
          {capitalize(formatMonthName(current))}
        </Text>
        <Text variant="label-medium" as="span" className={styles.pill}>
          En cours
        </Text>
      </div>
      <div className={styles.amountLine}>
        <Text variant="h1" as="span" tabular color={remaining < 0 ? 'danger' : 'primary'}>
          {formatEuro(Math.abs(remaining))}
        </Text>
        <Text variant="label-regular" as="span" color="secondary">
          {remaining < 0 ? 'de dépassement' : 'restants'}
        </Text>
      </div>
      <Gauge
        ratio={budget > 0 ? engaged / budget : 1}
        fill={remaining < 0 ? 'bg-danger' : 'bg-accent'}
        track="bg-brand-muted"
      />
      <Text variant="label-regular" color="secondary" tabular>
        {budget > 0 ? `${percent(engaged / budget)} du budget engagé` : 'Aucun budget défini'} ·
        encore {daysLeft} {daysLeft > 1 ? 'jours' : 'jour'}
      </Text>
      <TextLink
        label="Voir mon budget"
        icon="chevron"
        iconPosition="right"
        className={styles.link}
        onClick={() => {
          setMonth(current)
          navigate('/')
        }}
      />
    </Card>
  )

  if (!selected) {
    return (
      <Page title="Mon évolution" subtitle="Ce que tu mets de côté, mois après mois">
        <MainColumn>
          <EmptyState
            title="Pas encore de bilan"
            message={`Ton premier bilan arrivera le ${formatDayMonth(makeDay(addMonths(current, 1), 1))}.`}
          />
        </MainColumn>
        <AsideColumn>{currentCard}</AsideColumn>
      </Page>
    )
  }

  const month = selected.month
  const prev = addMonths(month, -1)
  const previousSavings = sel.firstDataMonth(data, today) <= prev ? sel.savings(data, prev) : null
  const savingsDelta = previousSavings === null ? null : selected.savings - previousSavings
  const comparisons = sel.compareWithPreviousMonth(data, month)
  const fixedNow = sel.fixedTotal(data, month)
  const fixedPrev = sel.fixedTotal(data, prev)
  const uncategorizedNow = sel.categorySpent(data, month, null)
  const uncategorizedPrev = sel.categorySpent(data, prev, null)
  const name = formatMonthName(month)
  const prevName = formatMonthName(prev)

  return (
    <Page title="Mon évolution" subtitle="Ce que tu mets de côté, mois après mois">
      <MainColumn>
        <Card label="Économies">
          <div className={styles.figure}>
            <Text variant="body-medium" color={selected.savings < 0 ? 'danger' : 'brand-faint'}>
              {selected.savings < 0 ? `Dépassement en ${name}` : `Économisé en ${name}`}
            </Text>
            <Text variant="display-l" tabular color={selected.savings < 0 ? 'danger' : 'brand'}>
              {formatEuroShort(Math.abs(Math.round(selected.savings / 100) * 100))}
            </Text>
            <div className={styles.context}>
              {savingsDelta !== null &&
                (savingsDelta === 0 ? (
                  <TrendBadge tone="neutral" direction="flat" label={`Stable vs ${prevName}`} />
                ) : (
                  <TrendBadge
                    tone={savingsDelta > 0 ? 'positive' : 'negative'}
                    direction={savingsDelta > 0 ? 'up' : 'down'}
                    label={`${savingsDelta > 0 ? '+' : '−'}${formatEuroShort(Math.abs(Math.round(savingsDelta / 100) * 100))} vs ${prevName}`}
                  />
                ))}
              <Text variant="label-regular" as="span" tabular>
                {formatEuroShort(Math.round(summary.total / 100) * 100)} mis de côté sur{' '}
                {summary.months} mois
              </Text>
            </div>
          </div>
          <SavingsChart
            months={series.map((m) => ({ month: m.month, value: m.savings }))}
            selected={month}
            onSelect={setPicked}
          />
        </Card>

        <Section
          title={`${capitalize(name)}, catégorie par catégorie`}
          subtitle={`${formatEuro(sel.monthSpent(data, month))} dépensés · ${formatEuro(sel.monthSpent(data, prev))} en ${prevName}`}
        >
          <div className={styles.table}>
            <div className={`t-label-medium ${styles.row} ${styles.head}`}>
              <span className={styles.name}>Catégorie</span>
              <span className={styles.cell}>{capitalize(name)}</span>
              <span className={`${styles.cell} ${styles.previous}`}>{capitalize(prevName)}</span>
              <span className={`${styles.cell} ${styles.cellWide}`}>Écart</span>
            </div>
            <CompareRow
              color="bg-accent"
              label="Dépenses fixes"
              now={fixedNow}
              previous={fixedPrev}
            />
            {comparisons.map((c) => (
              <CompareRow
                key={c.category.id}
                color={categoryPaint(c.category).fg}
                label={c.category.name}
                now={c.spent}
                previous={c.previous}
              />
            ))}
            {(uncategorizedNow > 0 || uncategorizedPrev > 0) && (
              <CompareRow
                color="icon-muted"
                label="À catégoriser"
                now={uncategorizedNow}
                previous={uncategorizedPrev}
              />
            )}
          </div>
        </Section>
      </MainColumn>

      <AsideColumn>
        {currentCard}
        <Card compact label="Bilan">
          <Text variant="h3" as="h2">
            Sur {summary.months} mois
          </Text>
          <Stat
            label="Total mis de côté"
            value={formatEuroShort(Math.round(summary.total / 100) * 100)}
          />
          <div className={styles.separator} />
          <Stat
            label="Moyenne"
            value={`${formatEuroShort(Math.round(summary.average / 100) * 100)} / mois`}
          />
          <div className={styles.separator} />
          <Stat
            label="Meilleur mois"
            value={
              summary.best
                ? `${capitalize(formatMonthName(summary.best.month))} · ${formatEuroShort(Math.round(summary.best.savings / 100) * 100)}`
                : '—'
            }
          />
          <div className={styles.separator} />
          <Stat label="Mois dans le vert" value={`${summary.inTheGreen} sur ${summary.months}`} />
        </Card>
      </AsideColumn>
    </Page>
  )
}

function CompareRow({
  color,
  label,
  now,
  previous
}: {
  color: string
  label: string
  now: number
  previous: number
}): React.JSX.Element {
  return (
    <div className={styles.row}>
      <span className={styles.name}>
        <span className={styles.dot} style={{ background: cssColor(color) }} aria-hidden="true" />
        <Text variant="body-medium" as="span">
          {label}
        </Text>
      </span>
      <Text variant="body-bold" as="span" tabular className={styles.cell}>
        {formatEuro(now)}
      </Text>
      <Text
        variant="body-regular"
        as="span"
        tabular
        className={`${styles.cell} ${styles.previous}`}
      >
        {formatEuro(previous)}
      </Text>
      <span className={`${styles.cell} ${styles.cellWide}`}>{spendingBadge(now - previous)}</span>
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
