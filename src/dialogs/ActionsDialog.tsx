import { Dialog } from '../components/Dialog'
import { Button } from '../components/Button'
import type { RowAction } from '../ui/uiStore'
import styles from './Dialogs.module.css'

/** Touch replacement for the actions revealed on hover on desktop. */
export function ActionsDialog({
  title,
  actions,
  onClose
}: {
  title: string
  actions: RowAction[]
  onClose(): void
}): React.JSX.Element {
  return (
    <Dialog title={title} onClose={onClose} size="small">
      <div className={styles.actionList}>
        {actions.map((a) => (
          <Button
            key={a.label}
            label={a.label}
            icon={a.icon}
            variant={a.danger ? 'danger' : 'secondary'}
            fullWidth
            onClick={() => {
              onClose()
              a.onSelect()
            }}
          />
        ))}
      </div>
    </Dialog>
  )
}
