import { useBudgetScreen } from '../../../features/useBudgetScreen'
import { formatEuroShort } from '../../../data/money'
import { Avatar } from '../../../components/Avatar'
import { Text } from '../../../components/Text'
import { MobilePage } from '../../../layout/Page'
import { AllocationBar } from '../../shared/AllocationBar'
import { ActionRow, ListGroup, MenuRow, Row } from '../../shared/List'
import { PushedHeader } from '../components/PushedHeader'
import styles from './Budget.module.css'

const pct = (share: number): string => `${Math.round(share * 100)} %`

/** Figma: 03 · Depuis Mon budget › Budget (428:5657). */
export function Budget(): React.JSX.Element {
  const b = useBudgetScreen()
  const over = b.breakdown.toAllocate < 0

  return (
    <MobilePage>
      <PushedHeader
        title="Budget"
        onBack={b.actions.back}
        action={{ icon: 'edit', label: 'Modifier le budget mensuel', onClick: b.actions.editBudget }}
      />

      <button type="button" className={styles.card} onClick={b.actions.editBudget}>
        <span className={styles.spread}>
          <Text variant="body-regular" color="secondary" as="span">
            Budget de {b.monthName}
          </Text>
          <Text variant="body-regular" color="secondary" as="span">
            {b.postCount} poste{b.postCount > 1 ? 's' : ''}
          </Text>
        </span>
        <Text variant="display-l" color="brand" as="span" tabular className={styles.figure}>
          {formatEuroShort(b.breakdown.budget)}
        </Text>
        <AllocationBar
          segments={b.segments}
          total={b.breakdown.budget}
          label={`${formatEuroShort(b.allocated)} répartis sur ${formatEuroShort(b.breakdown.budget)}`}
        />
        <span className={styles.spread}>
          <Text variant="label-medium" as="span" tabular>
            {formatEuroShort(b.allocated)} répartis
          </Text>
          <Text variant="label-medium" color={over ? 'danger' : 'brand'} as="span" tabular>
            {over
              ? `${formatEuroShort(-b.breakdown.toAllocate)} au-delà du budget`
              : `${formatEuroShort(b.breakdown.toAllocate)} à répartir`}
          </Text>
        </span>
      </button>

      <section className={styles.section} aria-labelledby="budget-split">
        <Text variant="h2" as="h2" id="budget-split">
          Répartition
        </Text>
        <ListGroup>
          {b.lines.map((l) => (
            <Row
              key={l.key}
              leading={<Avatar color={l.paint} initial={l.initial} />}
              title={l.name}
              subtitle={l.detail}
              trailing={formatEuroShort(l.amount)}
              trailingSub={pct(l.share)}
              onClick={l.onClick}
            />
          ))}
          <ActionRow icon="add" label="Nouvelle catégorie" onClick={b.actions.newCategory} />
        </ListGroup>
      </section>

      <section className={styles.section} aria-labelledby="budget-options">
        <Text variant="h2" as="h2" id="budget-options">
          Options
        </Text>
        <ListGroup>
          <MenuRow
            icon="trendUp"
            label="Objectif d’épargne"
            value={b.options.goal}
            onClick={b.actions.editGoal}
          />
          <MenuRow
            icon="calendar"
            label="Début du mois"
            value={b.options.start}
            onClick={b.actions.editStart}
          />
          <MenuRow
            icon="clock"
            label="Report du reste"
            value={b.options.rollover}
            onClick={b.actions.editRollover}
          />
        </ListGroup>
      </section>
    </MobilePage>
  )
}
