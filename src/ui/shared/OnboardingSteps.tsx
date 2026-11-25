// Steps 1 and 2 of the onboarding, the same in both styles (Figma 431:6266, 431:6300).
import type { useOnboarding } from '../../features/useOnboarding'
import { formatEuroShort } from '../../data/money'
import { AmountInput } from '../../components/AmountInput'
import { Icon } from '../../components/Icon'
import { Text } from '../../components/Text'
import { AmountField } from './AmountField'
import { ProfileAvatar } from './ProfileAvatar'
import styles from './OnboardingSteps.module.css'

type Onboarding = ReturnType<typeof useOnboarding>

export function WelcomeStep({ o }: { o: Onboarding }): React.JSX.Element {
  const initial = (o.firstName.trim() || 'B').charAt(0).toUpperCase()
  return (
    <>
      <label className={styles.formRow}>
        <Text variant="body-regular" color="secondary" as="span">
          Prénom
        </Text>
        <input
          className={styles.textInput}
          value={o.firstName}
          onChange={(e) => o.setFirstName(e.target.value)}
          autoComplete="given-name"
          enterKeyHint="next"
          maxLength={40}
          placeholder="Ton prénom"
        />
      </label>
      <div className={styles.avatarRow}>
        <ProfileAvatar initial={initial} color="bleu" size="small" />
        <Text variant="label-regular" color="secondary" as="span">
          Ton avatar, modifiable plus tard dans ton profil
        </Text>
      </div>
      <div className={styles.spacer} />
      <div className={styles.privacy}>
        <Icon name="profile" size={20} />
        <Text variant="label-regular" color="secondary" as="span">
          Pas de compte, pas de serveur : tes données restent sur ton téléphone.
        </Text>
      </div>
    </>
  )
}

export function BudgetStep({ o }: { o: Onboarding }): React.JSX.Element {
  return (
    <>
      <div className={styles.amount}>
        <AmountInput value={o.budget} onChange={o.setBudget} label="Budget mensuel" />
        {o.budgetCents > 0 && (
          <Text variant="label-regular" color="secondary">
            Soit {formatEuroShort(Math.floor(o.budgetCents / 30 / 100) * 100)} par jour environ
          </Text>
        )}
      </div>
      <section className={styles.card} aria-labelledby="onboarding-savings">
        <Text variant="h3" as="h2" id="onboarding-savings" className={styles.cardTitle}>
          Épargne
        </Text>
        <div className={styles.cardRow}>
          <Text variant="body-medium" as="span" className={styles.grow}>
            Épargne mensuelle
          </Text>
          <AmountField
            value={o.savings}
            onChange={o.setSavings}
            label="Objectif d’épargne mensuel, en euros"
            suggestion={o.budgetCents > 0 ? o.savingsSuggestion : undefined}
          />
        </div>
        <Text variant="label-regular" color="secondary" as="p" className={styles.cardHint}>
          Laisse vide pour garder la suggestion (5 % de ton budget). Réservé dès le 1er, comme une
          dépense fixe.
        </Text>
      </section>
    </>
  )
}
