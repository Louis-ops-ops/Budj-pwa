// Frame of the onboarding steps, shared by both styles (Figma 01 · Onboarding):
// progress bar with « 1 / 3 », eyebrow + title + subtitle, actions at the bottom.
import { useRef, type FormEvent, type ReactNode } from 'react'
import { useStatusBar } from '../pro/components/ProPage'
import type { useOnboarding } from '../../features/useOnboarding'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { InstallHelp } from '../../components/InstallHelp'
import { Text } from '../../components/Text'
import { TextLink } from '../../components/TextLink'
import styles from './OnboardingFrame.module.css'

type Onboarding = ReturnType<typeof useOnboarding>

const COPY: Record<number, { eyebrow: string; title: string; sub: string }> = {
  0: {
    eyebrow: 'Avant de commencer',
    title: 'Installe Budj sur ton écran d’accueil',
    sub: 'Tes données restent dans l’app installée : configure-la depuis son icône.'
  },
  1: {
    eyebrow: 'Bienvenue sur Budj',
    title: 'Salut ! Comment tu t’appelles ?',
    sub: 'On s’en sert juste pour personnaliser l’app.'
  },
  2: {
    eyebrow: 'Ton budget',
    title: 'Combien tu veux dépenser par mois ?',
    sub: 'Tout compris : loyer, abonnements, courses, sorties…'
  },
  3: {
    eyebrow: 'Tes catégories',
    title: 'Où part ton argent ?',
    sub: 'Coche tes postes de dépenses et indique combien tu veux y mettre chaque mois.'
  }
}

export function OnboardingFrame({
  o,
  hero,
  children
}: {
  o: Onboarding
  hero: boolean
  children: ReactNode
}): React.JSX.Element {
  const copy = COPY[o.step]
  const submit = (e: FormEvent): void => {
    e.preventDefault()
    if (o.canContinue) o.actions.next()
  }
  const firstStep = o.needsInstall ? 0 : 1
  const screenRef = useRef<HTMLDivElement>(null)
  useStatusBar(screenRef, hero ? 'home' : 'none')

  return (
    <div ref={screenRef} className={styles.screen} data-hero={hero ? 'home' : undefined}>
      {hero && <div className={styles.gradient} aria-hidden="true" />}
      <form className={styles.content} onSubmit={submit} noValidate>
        <div className={styles.progress}>
          {o.step > firstStep ? (
            <button type="button" className={styles.back} aria-label="Retour" onClick={o.actions.back}>
              <Icon name="chevron" size={20} rotate={180} />
            </button>
          ) : (
            <span className={styles.backSpace} aria-hidden="true" />
          )}
          <span className={styles.bars} aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span key={n} className={styles.bar} data-done={n <= o.step} />
            ))}
          </span>
          <Text variant="label-medium" as="span" className={styles.count}>
            {o.step === 0 ? '' : `${o.step} / ${o.stepCount}`}
          </Text>
        </div>

        <div className={styles.titles}>
          <Text variant="label-medium" color="brand" as="p" className={styles.eyebrow}>
            {copy.eyebrow}
          </Text>
          <Text variant="h1" as="h1">
            {copy.title}
          </Text>
          <Text variant="body-regular" color="secondary" as="p">
            {copy.sub}
          </Text>
        </div>

        <div className={styles.body}>{o.step === 0 ? <InstallHelp /> : children}</div>

        <div className={styles.actions}>
          {o.step === 0 ? (
            <TextLink label="Continuer dans le navigateur" onClick={o.actions.next} />
          ) : (
            <>
              <Button
                type="submit"
                label={o.step === 3 ? 'C’est parti' : 'Continuer'}
                disabled={!o.canContinue}
                className={styles.primary}
              />
              {o.step === 2 && <TextLink label="Passer cette étape" onClick={o.actions.skipSavings} />}
            </>
          )}
        </div>
      </form>
    </div>
  )
}
