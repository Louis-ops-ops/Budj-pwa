import { Avatar } from './Avatar'
import { Text } from './Text'
import styles from './UpcomingCharge.module.css'

interface UpcomingChargeProps {
  highlighted?: boolean
  name: string
  dueLabel: string
  amount: string
  initial: string
}

export function UpcomingCharge({
  highlighted,
  name,
  dueLabel,
  amount,
  initial
}: UpcomingChargeProps): React.JSX.Element {
  return (
    <div className={[styles.item, highlighted ? styles.highlighted : ''].join(' ')}>
      <Avatar color="bleu" initial={initial} />
      <div className={styles.texts}>
        <div className={styles.main}>
          <Text variant="body-medium" as="span" className={styles.name}>
            {name}
          </Text>
          <Text variant="body-bold" as="span" tabular className={styles.amount}>
            {amount}
          </Text>
        </div>
        <Text variant="label-regular" as="span" className={styles.due}>
          {dueLabel}
        </Text>
      </div>
    </div>
  )
}
