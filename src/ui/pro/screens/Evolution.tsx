import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { categoryPaint } from '../../../data/colors'
import { addMonths, formatMonthName, formatMonthYear, todayISO } from '../../../data/dates'
import { formatEuroFloor, formatEuroShort, formatEuroSigned } from '../../../data/money'
import * as sel from '../../../data/selectors'
import { useBudj } from '../../../data/store'
import { Avatar } from '../../../components/Avatar'
import { GhostChart, SavingsChart } from '../../../components/SavingsChart'
import { Text } from '../../../components/Text'
import { GoalState } from '../../../screens/EvolutionMobile'
import { FormRow, Row } from '../../shared/List'
import { GaugeRow, ProCard, ProHero } from '../components/ProBlocks'
import { ProPage, ProSection } from '../components/ProPage'
import { DetailTopBar, TabTopBar } from '../components/ProTopBar'
import styles from './History.module.css'

const MONTHS = 6
const rounded = (cents: number): number => Math.round(cents / 100) * 100
const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

/** Figma: UI - Pro › 09 · Évolution (384:12630) and the detail of a month. */
export function Evolution(): React.JSX.Element {
  const { month } = useParams()
  return month ? <MonthDetail month={month} /> : <Overview />
}

function Overview(): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const navigate = useNavigate()
  const today = todayISO()
  const current = sel.currentMonth(data, today)
  const series = sel.savingsSeries(data, today).slice(-MONTHS)
  const [picked, setPicked] = useState<string | null>(null)
  const selected = series.find((m) => m.month === picked) ?? series.at(-1)
  const total = series.reduce((a, m) => a + m.savings, 0)
  const hits = sel.goalHitCount(data, today, MONTHS)
  const goal = sel.savingsGoal(data, current)
  const rows = sel.monthRows(data, today)

  return (
    <ProPage hero="evolution" label="Évolution">
      <TabTopBar month={current} />
      <ProHero
        label={selected ? `Épargné en ${formatMonthName(selected.month)}` : 'Ton évolution'}
        cents={selected?.savings ?? 0}
        danger={(selected?.savings ?? 0) < 0}
        sub={selected ? `sur ${formatEuroShort(sel.monthBudget(data, selected.month))}` : 'arrive bientôt'}
      />
      <ProSection>
        <ProCard
          title={series.length > 0 ? `${formatEuroSigned(rounded(total))} sur ${series.length} mois` : 'Ton évolution arrive bientôt'}
        >
          <div className={styles.empty}>
            {series.length > 0 && selected ? (
              <SavingsChart
                months={series.map((m) => ({ month: m.month, value: m.savings, goal: sel.savingsGoal(data, m.month) }))}
                selected={selected.month}
                onSelect={setPicked}
                goalLabel={`Objectif ${formatEuroShort(goal)} par mois · atteint ${hits.hit} mois sur ${hits.total}`}
              />
            ) : (
              <>
                <GhostChart />
                <Text variant="label-regular" color="secondary" as="p">
                  Ton premier bilan apparaîtra à la fin de ce mois-ci.
                </Text>
              </>
            )}
          </div>
        </ProCard>

        <ProCard title="Mois par mois">
          {rows.map((row) => {
            const isCurrent = row.month === current
            const remaining = sel.globalRemaining(data, row.month)
            const hasGoal = sel.savingsGoal(data, row.month) > 0
            return (
              <Row
                key={row.month}
                title={capitalize(formatMonthName(row.month))}
                subtitle={
                  isCurrent ? (
                    'En cours'
                  ) : hasGoal ? (
                    <GoalState state={sel.monthGoalState(data, row.month)} />
                  ) : (
                    `${formatEuroFloor(row.spent)} dépensés`
                  )
                }
                trailing={isCurrent ? formatEuroFloor(remaining) : formatEuroSigned(rounded(row.savings))}
                trailingSub={isCurrent ? 'restants' : `${formatEuroFloor(row.spent)} dépensés`}
                onClick={() => navigate(`/evolution/${row.month}`)}
              />
            )
          })}
        </ProCard>
      </ProSection>
    </ProPage>
  )
}

function MonthDetail({ month }: { month: string }): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const navigate = useNavigate()
  const budget = sel.monthBudget(data, month)
  const spent = sel.monthSpent(data, month)
  const savings = sel.monthSavings(data, month)
  const goal = sel.savingsGoal(data, month)
  const state = sel.monthGoalState(data, month)
  const prev = addMonths(month, -1)

  return (
    <ProPage hero="evolution" label={formatMonthYear(month)}>
      <DetailTopBar title={capitalize(formatMonthYear(month))} onBack={() => navigate('/evolution')} />
      <ProHero
        label={savings < 0 ? 'Dépassement' : 'Épargné'}
        cents={savings}
        danger={savings < 0}
        sub={`sur ${formatEuroShort(budget)}`}
      />
      <ProSection>
        <ProCard title="Budget">
          <FormRow label="Budget mensuel" value={formatEuroShort(budget)} />
          <FormRow label="Dépensé" value={formatEuroFloor(spent)} />
          <FormRow
            label={savings < 0 ? 'Dépassement' : 'Économisé'}
            value={formatEuroSigned(rounded(savings))}
            tone={savings < 0 ? 'danger' : 'success'}
          />
          {goal > 0 && (
            <FormRow
              label={`Objectif d’épargne · ${formatEuroShort(goal)}`}
              value={state === 'reached' ? 'atteint' : state === 'below' ? 'sous l’objectif' : 'manqué'}
              tone={state === 'reached' ? 'success' : state === 'missed' ? 'danger' : undefined}
            />
          )}
        </ProCard>
        <ProCard title={`Comparé à ${formatMonthName(prev)}`}>
          {sel.compareWithPreviousMonth(data, month).map((c) => (
            <GaugeRow
              key={c.category.id}
              paint={categoryPaint(c.category)}
              initial={c.category.name}
              title={c.category.name}
              subtitle={`${formatEuroFloor(c.previous)} en ${formatMonthName(prev)}`}
              amount={formatEuroFloor(c.spent)}
              detail={formatEuroSigned(rounded(c.delta))}
              amountTone={c.tone === 'positive' ? 'success' : c.tone === 'negative' ? 'danger' : undefined}
            />
          ))}
          {data.categories.length === 0 && (
            <Row leading={<Avatar color="uncategorized" initial="?" />} title="Aucune catégorie" />
          )}
        </ProCard>
      </ProSection>
    </ProPage>
  )
}
