import { Icon, type IconName } from '../../components/Icon'
import styles from './RoundAction.module.css'

/** Figma: Pro/Action ronde (388:1451), used by both styles under the hero. */
export function RoundAction({
  icon,
  label,
  onClick,
  tone = 'default'
}: {
  icon: IconName
  label: string
  onClick(): void
  tone?: 'default' | 'danger'
}): React.JSX.Element {
  return (
    <button type="button" className={styles.action} data-tone={tone} onClick={onClick}>
      <span className={styles.circle}>
        <Icon name={icon} size={24} />
      </span>
      <span className={`t-label-medium ${styles.label}`}>{label}</span>
    </button>
  )
}

export function RoundActions({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className={styles.row}>{children}</div>
}
