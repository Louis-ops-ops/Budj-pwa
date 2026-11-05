import { useEffect, useState } from 'react'
import type { ThemeSetting } from '../shared/types'
import { flushSave } from '../data/store'
import { importBackup } from '../platform/importBackup'
import { platform } from '../platform/storage'
import { changeTheme } from '../platform/theme'
import { InstallHelp } from '../components/InstallHelp'
import { useUi } from '../ui/uiStore'
import { Dialog } from '../components/Dialog'
import { Button } from '../components/Button'
import { SelectField } from '../components/Field'
import { Text } from '../components/Text'
import styles from './Dialogs.module.css'

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: 'system', label: 'Système' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' }
]

export function SettingsDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const openDialog = useUi((s) => s.openDialog)
  const toast = useUi((s) => s.toast)
  const [theme, setTheme] = useState<ThemeSetting>('system')

  useEffect(() => {
    void platform.getTheme().then(setTheme)
  }, [])

  const selectTheme = (value: ThemeSetting): void => {
    setTheme(value)
    changeTheme(value)
  }

  const exportData = async (): Promise<void> => {
    await flushSave()
    const result = await platform.exportData()
    if (result.ok) toast('Données exportées')
  }

  const importData = (): void => {
    openDialog({
      kind: 'confirm',
      title: 'Importer des données ?',
      message:
        'Cela remplacera toutes tes données actuelles. Pense à exporter d’abord si tu veux les garder.',
      confirmLabel: 'Choisir un fichier',
      onConfirm: () => void importBackup()
    })
  }

  return (
    <Dialog title="Réglages" onClose={onClose}>
      <SelectField label="Thème" value={theme} options={THEMES} onChange={selectTheme} />

      <InstallHelp />

      <div className={styles.group}>
        <Text variant="label-medium" className={styles.groupLabel}>
          Mes données
        </Text>
        <Text variant="label-regular" color="tertiary">
          Tes données restent sur cet appareil. Rien n’est envoyé sur internet.
        </Text>
        <div className={styles.row}>
          <Button
            label="Exporter mes données"
            variant="secondary"
            onClick={() => void exportData()}
          />
          <Button label="Importer des données" variant="secondary" onClick={importData} />
        </div>
      </div>

      <Text variant="caption-medium" color="secondary">
        Budj version {__APP_VERSION__}
      </Text>
    </Dialog>
  )
}
