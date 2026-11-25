import { useHome } from '../../../features/useHome'
import { formatNumber } from '../../../data/money'
import { useCountUp } from '../../../ui/motion'
import { Text } from '../../../components/Text'
import { MobilePage } from '../../../layout/Page'
import { RoundAction, RoundActions } from '../../shared/RoundAction'
import {
  CategoryCard,
  FixedCard,
  NoCategoryCard,
  SavingsGoalCard,
  SavingsInvite,
  UncategorizedCard
} from '../components/HomeCards'
import { HeroAmount } from '../components/HeroAmount'
import styles from './MyBudget.module.css'

/** Figma: Catégories / Mon budget (384:19667), empty state in 13 · États vides. */
export function MyBudget(): React.JSX.Element {
  const home = useHome()
  const shown = useCountUp(home.remaining)
  const { actions } = home

  return (
    <MobilePage>
      <section className={styles.hero} aria-label="Restant du mois">
        <Text variant="h1" as="h1">
          Mon budget
        </Text>
        <HeroAmount cents={shown} danger={home.remaining < 0} />
        {home.remaining < 0 && (
          <Text variant="body-medium" color="danger">
            de dépassement sur {formatNumber(Math.floor(home.budget / 100))} €
          </Text>
        )}
        <RoundActions>
          <RoundAction icon="categories" label="Catégories" onClick={actions.openManage} />
          <RoundAction icon="budget" label="Budget" onClick={actions.openBudget} />
          <RoundAction icon="more" label="Plus" onClick={actions.openMore} />
        </RoundActions>
      </section>

      <section className={styles.section} aria-labelledby="home-savings">
        <Text variant="h2" as="h2" id="home-savings" className={styles.title}>
          Objectif d’épargne
        </Text>
        {home.savings ? (
          <SavingsGoalCard savings={home.savings} onClick={actions.openSavingsGoal} />
        ) : (
          <SavingsInvite onClick={actions.openSavingsGoal} />
        )}
      </section>

      {home.over.length > 0 && (
        <section className={styles.section} aria-labelledby="home-over">
          <Text variant="h2" as="h2" id="home-over" className={styles.title}>
            Budget dépassé
          </Text>
          {home.over.map((s) => (
            <CategoryCard
              key={s.category.id}
              status={s}
              onClick={() => actions.openCategory(s.category.id)}
            />
          ))}
        </section>
      )}

      <section className={styles.section} aria-label="Catégories">
        <FixedCard total={home.fixedTotal} groups={home.fixedGroups} onClick={actions.openFixed} />
        {home.statuses.length === 0 ? (
          <NoCategoryCard onCreate={actions.newCategory} />
        ) : (
          home.onTrack.map((s) => (
            <CategoryCard
              key={s.category.id}
              status={s}
              onClick={() => actions.openCategory(s.category.id)}
            />
          ))
        )}
        {home.uncategorizedCount > 0 && (
          <UncategorizedCard
            total={home.uncategorizedTotal}
            count={home.uncategorizedCount}
            onClick={actions.sortUncategorized}
          />
        )}
      </section>
    </MobilePage>
  )
}
