import { useInstall, useInstallMode } from '../platform/install'
import { Button } from './Button'
import { Icon } from './Icon'
import { Text } from './Text'
import styles from './InstallHelp.module.css'

/** Install button on Chromium, step-by-step help on iOS (no install API there). */
export function InstallHelp(): React.JSX.Element | null {
  const mode = useInstallMode()
  const install = useInstall((s) => s.install)

  if (mode === 'prompt') {
    return (
      <Button label="Installer Budj" variant="secondary" onClick={() => void install()} />
    )
  }
  if (mode !== 'ios') return null

  return (
    <div className={styles.help}>
      <Text variant="label-medium" color="brand">
        Installer Budj sur ton iPhone
      </Text>
      <ol className={styles.steps}>
        <li className={styles.step}>
          <span className={`t-label-bold ${styles.number}`}>1</span>
          <Text variant="label-regular" as="span">
            Appuie sur Partager
          </Text>
          <Icon name="share" size={20} className={styles.share} />
        </li>
        <li className={styles.step}>
          <span className={`t-label-bold ${styles.number}`}>2</span>
          <Text variant="label-regular" as="span">
            Choisis « Sur l’écran d’accueil »
          </Text>
        </li>
        <li className={styles.step}>
          <span className={`t-label-bold ${styles.number}`}>3</span>
          <Text variant="label-regular" as="span">
            Appuie sur « Ajouter »
          </Text>
        </li>
      </ol>
    </div>
  )
}

/** Shown while the app runs in a browser tab: its data is not the installed app's data. */
export function InstallBanner({ onOpen }: { onOpen(): void }): React.JSX.Element | null {
  const mode = useInstallMode()
  if (mode !== 'ios' && mode !== 'prompt') return null
  return (
    <button type="button" className={styles.banner} onClick={onOpen}>
      <Text variant="label-medium" as="span" className={styles.bannerText}>
        Installe Budj sur ton écran d’accueil pour garder tes données
      </Text>
      <Icon name="chevron" size={16} />
    </button>
  )
}
