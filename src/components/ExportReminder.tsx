import { useEffect, useState } from 'react'
import { useBudj } from '../data/store'
import { exportBackup } from '../platform/backup'
import { platform } from '../platform/storage'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { Text } from './Text'
import styles from './ExportReminder.module.css'

/** Action banner of Réglages: no backup for 30 days, and data worth saving. */
export function ExportReminder(): React.JSX.Element | null {
  const hasData = useBudj((s) => s.data.expenses.length + s.data.fixedExpenses.length > 0)
  const [due, setDue] = useState(false)

  useEffect(() => {
    if (hasData) void platform.getExportReminder().then(setDue)
  }, [hasData])

  if (!hasData || !due) return null

  const save = async (): Promise<void> => {
    if (await exportBackup()) setDue(false)
  }

  const dismiss = (): void => {
    setDue(false)
    void platform.dismissExportReminder()
  }

  return (
    <div className={styles.banner}>
      <button type="button" className={styles.action} onClick={() => void save()}>
        <Text variant="body-medium" as="span" className={styles.text}>
          Fais une sauvegarde de tes données
        </Text>
        <Icon name="chevron" size={16} />
      </button>
      <IconButton icon="add" iconRotate={45} label="Masquer pendant 30 jours" onClick={dismiss} />
    </div>
  )
}
