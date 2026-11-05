import { Button } from './Button'
import { Text } from './Text'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?(): void
  actionIcon?: 'add' | null
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  actionIcon = 'add'
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className={styles.empty}>
      <Text variant="h3" color="primary">
        {title}
      </Text>
      <Text variant="label-regular" color="secondary">
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          variant="secondary"
          icon={actionIcon ?? undefined}
          onClick={onAction}
          className={styles.action}
        />
      )}
    </div>
  )
}
