import { useNavigate } from 'react-router'
import { formatMonthYear } from '../../../data/dates'
import { useBudj } from '../../../data/store'
import { Icon, type IconName } from '../../../components/Icon'
import { Text } from '../../../components/Text'
import { ProfileAvatar } from '../../shared/ProfileAvatar'
import styles from './ProTopBar.module.css'

/** Figma: Pro/Bouton rond (40 px). */
export function RoundButton({
  icon,
  label,
  onClick,
  rotate,
  pressed
}: {
  icon: IconName
  label: string
  onClick(): void
  rotate?: 0 | 90 | 180 | 270
  pressed?: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={styles.round}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <Icon name={icon} size={20} rotate={rotate} />
    </button>
  )
}

/**
 * Pro/Barre du haut, variant Onglet: avatar (opens the Profile) + month pill
 * (+ optional round action). The pill is a native select when months are given.
 */
export function TabTopBar({
  month,
  months,
  onMonth,
  action
}: {
  month: string
  months?: string[]
  onMonth?(month: string): void
  action?: { icon: IconName; label: string; onClick(): void }
}): React.JSX.Element {
  const navigate = useNavigate()
  const settings = useBudj((s) => s.data.settings)
  const initial = (settings.firstName.trim() || 'B').charAt(0).toUpperCase()
  const selectable = months && months.length > 1 && onMonth

  return (
    <header className={styles.bar}>
      <button
        type="button"
        className={styles.avatar}
        aria-label="Profil"
        onClick={() => navigate('/profil')}
      >
        <ProfileAvatar initial={initial} color={settings.avatarColor} size="small" />
      </button>
      <label className={styles.pill}>
        <Text variant="body-medium" as="span" className={styles.pillText}>
          {formatMonthYear(month)}
        </Text>
        {selectable && (
          <>
            <Icon name="chevron" size={16} rotate={90} />
            <select
              className={styles.select}
              aria-label="Mois"
              value={month}
              onChange={(e) => onMonth(e.target.value)}
            >
              {[...months].reverse().map((m) => (
                <option key={m} value={m}>
                  {formatMonthYear(m)}
                </option>
              ))}
            </select>
          </>
        )}
      </label>
      {action && <RoundButton {...action} />}
    </header>
  )
}

/** Pro/Barre du haut, variant Détail: round back button, centered title, round action. */
export function DetailTopBar({
  title,
  onBack,
  action,
  children
}: {
  title: string
  onBack(): void
  action?: { icon: IconName; label: string; onClick(): void; rotate?: 0 | 90 | 180 | 270 }
  /** Replaces the action (e.g. « Annuler » in selection mode). */
  children?: React.ReactNode
}): React.JSX.Element {
  return (
    <header className={styles.bar}>
      <RoundButton icon="chevron" rotate={180} label="Retour" onClick={onBack} />
      <Text variant="h2" as="h1" className={styles.title}>
        {title}
      </Text>
      {children ??
        (action ? <RoundButton {...action} /> : <span className={styles.spacer} aria-hidden="true" />)}
    </header>
  )
}
