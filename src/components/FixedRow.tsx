import { Avatar } from './Avatar'
import { IconButton } from './IconButton'
import { Text } from './Text'
import styles from './FixedRow.module.css'

interface FixedRowProps {
  status: 'paid' | 'upcoming'
  name: string
  detail?: string
  day: string
  monthly: string
  yearly: string
  initial: string
  onEdit?(): void
}

export function FixedRow({
  status,
  name,
  detail,
  day,
  monthly,
  yearly,
  initial,
  onEdit
}: FixedRowProps): React.JSX.Element {
  return (
    <div className={styles.row}>
      <Avatar color="bleu" initial={initial} />
      <span className={styles.texts}>
        <Text variant="body-medium" as="span">
          {name}
        </Text>
        {detail && (
          <Text variant="label-regular" as="span" className={styles.detail}>
            {detail}
          </Text>
        )}
      </span>
      <Text variant="label-regular" as="span" className={styles.day}>
        {day}
      </Text>
      <span className={styles.status}>
        <Text
          variant="label-medium"
          as="span"
          className={[styles.pill, status === 'paid' ? styles.paid : styles.upcoming].join(' ')}
        >
          {status === 'paid' ? 'Prélevé' : 'À venir'}
        </Text>
      </span>
      <Text variant="body-bold" as="span" tabular className={styles.monthly}>
        {monthly}
      </Text>
      <Text variant="label-regular" as="span" tabular className={styles.yearly}>
        {yearly}
      </Text>
      {onEdit && (
        <IconButton
          icon="edit"
          label={`Modifier ${name}`}
          onClick={onEdit}
          className={styles.edit}
        />
      )}
    </div>
  )
}
