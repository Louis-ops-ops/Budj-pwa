import type { IconName } from '../../../components/Icon'
import { IconButton } from '../../../components/IconButton'
import { Text } from '../../../components/Text'
import styles from './PushedHeader.module.css'

/** Playfull pushed screens: outlined icon buttons around a centered title. */
export function PushedHeader({
  title,
  onBack,
  action
}: {
  title: string
  onBack(): void
  action?: { icon: IconName; label: string; onClick(): void }
}): React.JSX.Element {
  return (
    <header className={styles.bar}>
      <IconButton icon="chevron" iconRotate={180} label="Retour" onClick={onBack} />
      <Text variant="h2" as="h1" className={styles.title}>
        {title}
      </Text>
      {action ? (
        <IconButton icon={action.icon} label={action.label} onClick={action.onClick} />
      ) : (
        <span className={styles.spacer} aria-hidden="true" />
      )}
    </header>
  )
}
