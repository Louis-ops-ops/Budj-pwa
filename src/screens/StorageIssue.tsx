import { useBudj, type StorageIssue } from '../data/store'
import { useUi } from '../ui/uiStore'
import { importBackup } from '../platform/importBackup'
import { Button } from '../components/Button'
import { Text } from '../components/Text'
import styles from './StorageIssue.module.css'

const COPY: Record<StorageIssue, [string, string]> = {
  unavailable: [
    'Budj ne peut pas enregistrer tes données dans ce mode de navigation',
    'Ouvre Budj dans une fenêtre normale de ton navigateur. Si c’est déjà le cas, vérifie qu’il reste de l’espace libre sur cet appareil.'
  ],
  corrupt: [
    'Tes données n’ont pas pu être lues',
    'Rien n’a été effacé : une copie est gardée sur cet appareil. Tu peux importer une sauvegarde pour retrouver tes données.'
  ]
}

/** Blocking screen: the app never runs on data it cannot save. */
export function StorageIssueScreen({ issue }: { issue: StorageIssue }): React.JSX.Element {
  const startFresh = useBudj((s) => s.startFresh)
  const openDialog = useUi((s) => s.openDialog)
  const [title, message] = COPY[issue]

  const confirmStartFresh = (): void => {
    openDialog({
      kind: 'confirm',
      title: 'Repartir de zéro ?',
      message: 'Budj redémarrera sans données. La copie illisible restera gardée sur cet appareil.',
      confirmLabel: 'Repartir de zéro',
      onConfirm: startFresh
    })
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card} role="alert">
        <Text variant="h1" as="h1">
          {title}
        </Text>
        <Text variant="body-regular" color="tertiary">
          {message}
        </Text>
        {issue === 'corrupt' && (
          <div className={styles.actions}>
            <Button label="Repartir de zéro" variant="secondary" onClick={confirmStartFresh} />
            <Button label="Importer une sauvegarde" onClick={() => void importBackup()} />
          </div>
        )}
      </div>
    </div>
  )
}
