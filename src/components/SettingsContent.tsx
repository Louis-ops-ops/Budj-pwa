import { useEffect, useState } from 'react'
import type { ThemeSetting } from '../shared/types'
import { formatBytes } from '../data/format'
import { exportBackup, importBackup } from '../platform/backup'
import { platform, type StorageStatus } from '../platform/storage'
import { changeTheme, resolveTheme } from '../platform/theme'
import { Button } from './Button'
import { ExportReminder } from './ExportReminder'
import { SelectField } from './Field'
import { InstallHelp } from './InstallHelp'
import { Text } from './Text'
import styles from './SettingsContent.module.css'

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' }
]

function StatusRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className={styles.statusRow}>
      <Text variant="label-regular" color="tertiary" as="span">
        {label}
      </Text>
      <Text variant="label-medium" as="span" tabular>
        {value}
      </Text>
    </div>
  )
}

/** Shared by the desktop dialog and the mobile Réglages tab. */
export function SettingsContent(): React.JSX.Element {
  const [theme, setTheme] = useState<ThemeSetting>('light')
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [exports, setExports] = useState(0)

  useEffect(() => {
    void platform.getTheme().then((t) => setTheme(resolveTheme(t)))
    void platform.getStorageStatus().then(setStatus)
  }, [])

  const saveBackup = async (): Promise<void> => {
    if (await exportBackup()) setExports((n) => n + 1)
  }

  const selectTheme = (value: ThemeSetting): void => {
    setTheme(value)
    changeTheme(value)
  }

  return (
    <div className={styles.content}>
      <SelectField label="Thème" value={theme} options={THEMES} onChange={selectTheme} />

      <InstallHelp />

      <section className={styles.section} aria-label="Mes données">
        <Text variant="label-medium" color="brand">
          Mes données
        </Text>
        <ExportReminder key={exports} />
        <div className={styles.status}>
          <StatusRow label="Stockage protégé" value={status?.persisted ? 'Oui' : 'Non'} />
          <StatusRow label="App installée" value={status?.installed ? 'Oui' : 'Non'} />
          {status?.usage !== undefined && (
            <StatusRow label="Espace utilisé" value={formatBytes(status.usage)} />
          )}
        </div>
        {status && !status.persisted && (
          <Text variant="label-regular" color="tertiary">
            Le navigateur peut effacer tes données s’il manque de place. Installe Budj et fais des
            sauvegardes régulières.
          </Text>
        )}
        <div className={styles.buttons}>
          <Button
            label="Exporter mes données"
            variant="secondary"
            onClick={() => void saveBackup()}
          />
          <Button
            label="Importer des données"
            variant="secondary"
            onClick={() => void importBackup()}
          />
        </div>
      </section>

      <section className={styles.section} aria-label="À savoir">
        <Text variant="label-medium" color="brand">
          À savoir
        </Text>
        <ul className={styles.notes}>
          <li>
            <Text variant="label-regular" color="tertiary" as="span">
              Tes données restent sur cet appareil, rien n’est envoyé sur internet.
            </Text>
          </li>
          <li>
            <Text variant="label-regular" color="tertiary" as="span">
              Elles sont liées à un appareil, un navigateur et une adresse. Il n’y a pas de
              synchronisation : l’export et l’import servent de transfert.
            </Text>
          </li>
          <li>
            <Text variant="label-regular" color="tertiary" as="span">
              Supprimer l’icône de l’écran d’accueil supprime les données de l’app.
            </Text>
          </li>
          <li>
            <Text variant="label-regular" color="tertiary" as="span">
              Sur iPhone, un onglet Safari et l’app installée ont chacun leurs propres données.
            </Text>
          </li>
        </ul>
      </section>

      <Text variant="caption-medium" color="secondary">
        Budj version {__APP_VERSION__}
      </Text>
    </div>
  )
}
