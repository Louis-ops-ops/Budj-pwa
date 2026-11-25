import { useOnboarding } from '../../../features/useOnboarding'
import { Avatar } from '../../../components/Avatar'
import { Icon } from '../../../components/Icon'
import { Text } from '../../../components/Text'
import { AmountField } from '../../shared/AmountField'
import { OnboardingFrame } from '../../shared/OnboardingFrame'
import { BudgetStep, WelcomeStep } from '../../shared/OnboardingSteps'
import styles from './Onboarding.module.css'

/** Figma: UI - Pro › 01 · Onboarding (431:6266 → 431:6347). Step 3: rows to tick. */
export function Onboarding(): React.JSX.Element {
  const o = useOnboarding()
  return (
    <OnboardingFrame o={o} hero>
      {o.step === 1 && <WelcomeStep o={o} />}
      {o.step === 2 && <BudgetStep o={o} />}
      {o.step === 3 && (
        <>
          <ul className={styles.list} aria-label="Catégories">
            {o.categories.map((c) => (
              <li key={c.name} className={styles.row}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={c.selected}
                  aria-label={c.name}
                  className={styles.check}
                  onClick={() => o.actions.toggle(c.name)}
                >
                  {c.selected && <Icon name="check" size={16} />}
                </button>
                <Avatar color={c.color} initial={c.name} />
                <Text variant="body-medium" as="span" className={styles.name}>
                  {c.name}
                </Text>
                {c.selected && (
                  <AmountField
                    value={c.amount}
                    onChange={(v) => o.actions.setAmount(c.name, v)}
                    label={`Budget de ${c.name}, en euros`}
                    suggestion={o.suggestionOf(c.name)}
                  />
                )}
              </li>
            ))}
          </ul>
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
