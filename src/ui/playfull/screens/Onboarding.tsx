import { useOnboarding } from '../../../features/useOnboarding'
import { Avatar } from '../../../components/Avatar'
import { CategoryChip, ChipList } from '../../../components/Chip'
import { Text } from '../../../components/Text'
import { AmountField } from '../../shared/AmountField'
import { OnboardingFrame } from '../../shared/OnboardingFrame'
import { BudgetStep, WelcomeStep } from '../../shared/OnboardingSteps'
import styles from './Onboarding.module.css'

/**
 * Figma: UI - Playfull › 01 · Onboarding (425:5059). Step 3: chips, then
 * « Ton budget par catégorie » with an amount per chosen category.
 */
export function Onboarding(): React.JSX.Element {
  const o = useOnboarding()
  const chosen = o.categories.filter((c) => c.selected)
  return (
    <OnboardingFrame o={o} hero={false}>
      {o.step === 1 && <WelcomeStep o={o} />}
      {o.step === 2 && <BudgetStep o={o} />}
      {o.step === 3 && (
        <>
          <ChipList label="Catégories">
            {o.categories.map((c) => (
              <CategoryChip
                key={c.name}
                label={c.name}
                color={c.color}
                selected={c.selected}
                onClick={() => o.actions.toggle(c.name)}
              />
            ))}
          </ChipList>
          {chosen.length > 0 && (
            <section className={styles.section} aria-labelledby="onboarding-split">
              <Text variant="h2" as="h2" id="onboarding-split">
                Ton budget par catégorie
              </Text>
              <ul className={styles.list}>
                {chosen.map((c) => (
                  <li key={c.name} className={styles.row}>
                    <Avatar color={c.color} initial={c.name} />
                    <Text variant="body-medium" as="span" className={styles.name}>
                      {c.name}
                    </Text>
                    <AmountField
                      value={c.amount}
                      onChange={(v) => o.actions.setAmount(c.name, v)}
                      label={`Budget de ${c.name}, en euros`}
                      suggestion={o.suggestionOf(c.name)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className={styles.summary} aria-live="polite">
            <Text variant="label-medium" color="secondary" as="span">
              {o.summary.text}
            </Text>
            <Text variant="label-medium" color={o.summary.over ? 'danger' : 'brand'} as="span" tabular>
              {o.summary.free}
            </Text>
          </p>
        </>
      )}
    </OnboardingFrame>
  )
}
