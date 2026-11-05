import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { categoryPaint } from '../data/colors'
import { addMonths, formatMonthName, formatMonthYear, monthOf, todayISO } from '../data/dates'
import {
  formatEuro,
  formatEuroFloor,
  formatEuroShort,
  formatEuroSigned,
  percent
} from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { EmptyState } from '../components/EmptyState'
import { Gauge } from '../components/Gauge'
import { IconButton } from '../components/IconButton'
import { SavingsChart } from '../components/SavingsChart'
import { Text } from '../components/Text'
import { TrendBadge } from '../components/TrendBadge'
import { MobilePage } from '../layout/Page'
import styles from './Mobile.module.css'

const CHART_MONTHS = 6
const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
const signedPercent = (n: number): string =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)} %`

/** Figma: Évolution, Mois par mois (171:632). */
export function EvolutionMobile(): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const navigate = useNavigate()
  const today = todayISO()
  const series = sel.savingsSeries(data, today).slice(-CHART_MONTHS)
  const rows = sel.monthRows(data, today)
  const [picked, setPicked] = useState<string | null>(null)
  const selected = series.find((m) => m.month === picked) ?? series[series.length - 1]

  const prev = selected && addMonths(selected.month, -1)
  const previous = series.find((m) => m.month === prev)
  const delta = selected && previous ? selected.savings - previous.savings : null
  const total = series.reduce((a, m) => a + m.savings, 0)

  return (
    <MobilePage>
      <header className={styles.header}>
        <Text variant="h1" as="h1">
          Mon évolution
        </Text>
        {selected && (
          <div className={styles.spread}>
            <Text variant="body-regular" color="brand-faint" as="span">
              Performance {/^[aeiouéè]/i.test(formatMonthName(selected.month)) ? 'd’' : 'de '}
              {formatMonthName(selected.month)}
            </Text>
            <Text variant="body-regular" color="brand-faint" as="span" tabular>
              sur {formatEuroShort(sel.monthBudget(data, selected.month))}
            </Text>
          </div>
        )}
      </header>

      {selected ? (
        <>
          <div className={styles.header}>
            <div className={styles.amountLine}>
              <Text
                variant="display-l"
                color={selected.savings < 0 ? 'danger' : 'brand'}
                tabular
                className={styles.amount}
              >
                {formatEuroFloor(Math.abs(selected.savings))}
              </Text>
              {selected.savings < 0 && (
                <Text variant="h3" color="danger">
                  de dépassement
                </Text>
              )}
            </div>
            {delta !== null && prev && (
              <div>
                <TrendBadge
                  tone={delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral'}
                  direction={delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}
                  label={`${formatEuroSigned(Math.round(delta / 100) * 100)} vs ${formatMonthName(prev)}`}
                />
              </div>
            )}
          </div>

          <section className={styles.chartCard} aria-label="Mes économies">
            <div className={styles.spread}>
              <Text variant="h3" as="h2">
                Mes économies
              </Text>
              <Text
                variant="label-medium"
                color={total < 0 ? 'danger' : 'success'}
                as="span"
                tabular
              >
                {formatEuroSigned(Math.round(total / 100) * 100)} sur {series.length} mois
              </Text>
            </div>
            <SavingsChart
              months={series.map((m) => ({ month: m.month, value: m.savings }))}
              selected={selected.month}
              onSelect={setPicked}
            />
          </section>
        </>
      ) : (
        <EmptyState
          title="Pas encore de bilan"
          message="Ton premier bilan arrivera à la fin de ce mois-ci."
        />
      )}

      <Text variant="h1" as="h2">
        Mois par mois
      </Text>
      <div className={styles.list}>
        {rows.map((row) => {
          const current = row.month === monthOf(today)
          const over = row.savings < 0
          return (
            <button
              key={row.month}
              type="button"
              className={styles.monthCard}
              onClick={() => navigate(`/evolution/${row.month}`)}
            >
              <span className={styles.headerRow}>
                <Text variant="h3" as="span">
                  {capitalize(formatMonthName(row.month))}
                </Text>
                {row.trend !== null && (
                  <TrendBadge
                    tone={current ? 'neutral' : row.trend <= 0 ? 'positive' : 'negative'}
                    direction={current ? 'flat' : row.trend < 0 ? 'down' : row.trend > 0 ? 'up' : 'flat'}
                    label={signedPercent(row.trend)}
                  />
                )}
              </span>
              <span className={styles.spread}>
                <Text
                  variant="label-regular"
                  color={over ? 'danger' : current ? 'brand' : 'primary'}
                  as="span"
                  tabular
                >
                  {formatEuroFloor(Math.abs(row.savings))}{' '}
                  {over ? 'de dépassement' : current ? 'restants' : 'économisés'}
                </Text>
                <Text variant="h3" as="span" tabular>
                  {formatEuroFloor(row.spent)}
                </Text>
              </span>
              <span className={styles.gaugeRow}>
                <Gauge
                  ratio={row.ratio}
                  fill={over ? 'bg-danger' : current ? 'bg-accent' : 'feedback-success-fg'}
                  track="bg-brand-strong"
                />
                <Text variant="caption-medium" as="span" tabular>
                  {percent(row.ratio)}
                </Text>
              </span>
            </button>
          )
        })}
      </div>
    </MobilePage>
  )
}

/** Figma: Évolution, Détail d'un mois (173:710). */
export function MonthDetailMobile({ month }: { month: string }): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const navigate = useNavigate()
  const prev = addMonths(month, -1)
  const savings = sel.savings(data, month)
  const spent = sel.monthSpent(data, month)
  const budget = sel.monthBudget(data, month)
  const comparisons = sel.compareWithPreviousMonth(data, month)
  const ratio = budget > 0 ? spent / budget : 1

  return (
    <MobilePage>
      <header>
        <IconButton
          icon="chevron"
          iconRotate={180}
          label="Mon évolution"
          onClick={() => navigate('/evolution')}
        />
      </header>
      <div className={styles.headerRow}>
        <Text variant="h1" as="h1">
          {capitalize(formatMonthYear(month))}
        </Text>
        <TrendBadge
          tone={savings >= 0 ? 'positive' : 'negative'}
          direction={savings >= 0 ? 'up' : 'down'}
          label={savings >= 0 ? 'Progression' : 'Régression'}
        />
      </div>

      <section className={styles.summary} aria-label="Bilan du mois">
        <div className={styles.spread}>
          <Text variant="h3" as="span">
            Budget total
          </Text>
          <Text variant="h3" as="span" tabular>
            {formatEuroShort(budget)}
          </Text>
        </div>
        <div className={styles.spread}>
          <Text variant="body-regular" as="span">
            Dépensé
          </Text>
          <Text variant="body-regular" as="span" tabular>
            {formatEuro(spent)}
          </Text>
        </div>
        <div className={styles.spread}>
          <Text variant="body-regular" as="span">
            {savings < 0 ? 'Dépassement' : 'Économisé'}
          </Text>
          <Text variant="body-regular" color={savings < 0 ? 'danger' : 'success'} as="span" tabular>
            {formatEuroSigned(savings)}
          </Text>
        </div>
        <div className={styles.gaugeRow}>
          <Gauge
            ratio={ratio}
            fill={savings < 0 ? 'bg-danger' : 'feedback-success-fg'}
            track="bg-brand-strong"
          />
          <Text variant="caption-medium" as="span" tabular>
            {percent(ratio)}
          </Text>
        </div>
      </section>

      <div className={styles.header}>
        <Text variant="h2" as="h2">
          Comparé à {formatMonthName(prev)}
        </Text>
        <div className={styles.spread}>
          <Text variant="body-regular" color="brand-faint" as="span">
            Dépensé en {formatMonthName(prev)}
          </Text>
          <Text variant="body-regular" color="brand-faint" as="span" tabular>
            {formatEuro(sel.monthSpent(data, prev))}
          </Text>
        </div>
      </div>

      <div className={styles.list}>
        {comparisons.map((c) => {
          const paint = categoryPaint(c.category)
          return (
            <div
              key={c.category.id}
              className={styles.compareCard}
              style={{ '--card-bg': paint.bg, '--card-fg': paint.fg } as CSSProperties}
            >
              <span className={styles.fixedTexts}>
                <Text variant="h3" as="span" className={styles.primaryText}>
                  {c.category.name}
                </Text>
                <Text variant="label-regular" as="span" tabular>
                  {formatEuro(c.spent)} dépensés
                </Text>
              </span>
              <Text
                variant="h1"
                as="span"
                tabular
                color={c.tone === 'positive' ? 'success' : c.tone === 'negative' ? 'danger' : 'primary'}
              >
                {c.delta === 0 ? 'Stable' : formatEuroSigned(c.delta)}
              </Text>
            </div>
          )
        })}
      </div>
    </MobilePage>
  )
}
