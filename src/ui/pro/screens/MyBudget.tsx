import { categoryPaint } from '../../../data/colors'
import { formatMonthName, formatRelative } from '../../../data/dates'
import { formatEuro, formatEuroFloor, formatEuroShort } from '../../../data/money'
import { useHome } from '../../../features/useHome'
import { ActionRow } from '../../shared/List'
import { RoundAction, RoundActions } from '../../shared/RoundAction'
import { GaugeRow, ProCard, ProHero } from '../components/ProBlocks'
import { ProPage, ProSection } from '../components/ProPage'
import { TabTopBar } from '../components/ProTopBar'
import { RemainingCurve } from '../components/RemainingCurve'
import styles from './MyBudget.module.css'

const FIXED = { bg: 'var(--category-bleu-bg)', fg: 'var(--category-bleu-fg)' }
const SAVINGS = { bg: 'var(--feedback-success-bg)', fg: 'var(--feedback-success-fg)' }
const UNCATEGORIZED = { bg: 'var(--category-gris-bg)', fg: 'var(--category-gris-fg)' }

/** Figma: UI - Pro › 02 · Mon budget (389:4141). */
export function MyBudget(): React.JSX.Element {
  const home = useHome()
  const { actions } = home
  const monthName = formatMonthName(home.month)
  const next = home.nextCharge

  return (
    <ProPage hero="home" label="Mon budget">
      <TabTopBar month={home.month} />

      <ProHero
        label={`Restant en ${monthName}`}
        cents={home.remaining}
        danger={home.remaining < 0}
        sub={`sur ${formatEuroShort(home.budget)}${
          home.savings ? ` · ${formatEuroShort(home.savings.goal)} déjà mis de côté` : ''
        }`}
      />

      <RemainingCurve curve={home.curve} />

      <RoundActions>
        <RoundAction icon="calendar" label="Fixes" onClick={actions.openFixed} />
        <RoundAction icon="budget" label="Budget" onClick={actions.openBudget} />
        <RoundAction icon="add" label="Plus" onClick={actions.openMore} />
      </RoundActions>

      <ProSection>
        <ProCard label="Épargne">
          {home.savings ? (
            <GaugeRow
              paint={SAVINGS}
              initial="€"
              title="Épargne"
              subtitle="Réservée dès le 1er"
              amount={formatEuroShort(home.savings.expected)}
              amountTone={home.savings.status === 'onTrack' ? 'success' : 'danger'}
              detail={home.savings.status === 'onTrack' ? 'objectif tenu' : 'à surveiller'}
              ratio={home.savings.expected / home.savings.goal}
              gaugeColor={home.savings.status === 'onTrack' ? 'var(--text-success)' : 'var(--icon-danger)'}
              onClick={actions.openSavingsGoal}
            />
          ) : (
            <ActionRow icon="trendUp" label="Définir un objectif d’épargne" onClick={actions.openSavingsGoal} />
          )}
        </ProCard>

        <ProCard label="Dépenses fixes">
          <GaugeRow
            paint={FIXED}
            initial="F"
            title="Dépenses fixes"
            subtitle={
              next
                ? `${next.fixed.label} ${formatRelative(home.today, next.date)} · ${formatEuro(next.fixed.amount)}`
                : 'Aucun prélèvement à venir'
            }
            amount={formatEuroFloor(home.fixedTotal)}
            detail={`${formatEuroFloor(home.fixedPaid)} prélevés`}
            ratio={home.fixedTotal > 0 ? home.fixedPaid / home.fixedTotal : 0}
            onClick={actions.openFixed}
          />
        </ProCard>

        <ProCard title="Catégories" action={{ label: 'Gérer', onClick: actions.openManage }}>
          {home.statuses.length === 0 && (
            <p className={`t-label-regular ${styles.empty}`}>
              Pas encore de catégorie : crée tes postes de dépenses pour répartir ton budget.
            </p>
          )}
          {home.statuses.map((s) => (
            <GaugeRow
              key={s.category.id}
              paint={categoryPaint(s.category)}
              initial={s.category.name}
              title={s.category.name}
              subtitle={`${formatEuroFloor(s.spent)} dépensés`}
              amount={s.over ? `−${formatEuroFloor(-s.remaining)}` : formatEuroFloor(s.remaining)}
              amountTone={s.over ? 'danger' : undefined}
              detail={s.over ? 'dépassé' : `sur ${formatEuroShort(s.budget)}`}
              ratio={s.over ? 1 : s.budget > 0 ? s.spent / s.budget : 0}
              gaugeColor={s.over ? 'var(--icon-danger)' : undefined}
              onClick={() => actions.openCategory(s.category.id)}
            />
          ))}
          {home.uncategorizedCount > 0 && (
            <GaugeRow
              paint={UNCATEGORIZED}
              initial="?"
              title="À catégoriser"
              subtitle={`${home.uncategorizedCount} dépense${home.uncategorizedCount > 1 ? 's' : ''} à ranger`}
              amount={formatEuroFloor(home.uncategorizedTotal)}
              onClick={actions.sortUncategorized}
            />
          )}
          <ActionRow icon="add" label="Nouvelle catégorie" onClick={actions.newCategory} />
        </ProCard>
      </ProSection>
    </ProPage>
  )
}
