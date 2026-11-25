// Body of Réglages, the same in both styles (Figma 10 · Réglages, 418:4764):
// only the header and the background differ.
import { STYLE_ROW_ID, useSettings } from '../../features/useSettings'
import { formatBytes } from '../../data/format'
import { InstallHelp } from '../../components/InstallHelp'
import { Text } from '../../components/Text'
import { ListGroup, ListSection, MenuRow, Row, SwitchRow } from './List'
import styles from './SettingsList.module.css'

export function SettingsList(): React.JSX.Element {
  const s = useSettings()
  const { reminders, actions } = s

  return (
    <div className={styles.list}>
      <ListSection title="Rappels (dans l’app)">
        <ListGroup>
          <SwitchRow
            label="Rappel du soir"
            hint="Si tu n’as rien noté de la journée"
            checked={reminders.evening}
            onChange={(evening) => actions.setReminder({ evening })}
          />
          {reminders.evening && (
            <MenuRow
              icon="clock"
              label="Heure"
              value={reminders.eveningTime}
              onClick={actions.editReminderTime}
            />
          )}
          <SwitchRow
            label="Veille de prélèvement"
            hint="Netflix est prélevé demain…"
            checked={reminders.chargeEve}
            onChange={(chargeEve) => actions.setReminder({ chargeEve })}
          />
          <SwitchRow
            label="Alerte à 80 % du budget"
            hint="Quand une catégorie approche de sa limite"
            checked={reminders.budgetAlert80}
            onChange={(budgetAlert80) => actions.setReminder({ budgetAlert80 })}
          />
        </ListGroup>
        <Text variant="label-regular" color="secondary">
          Une app web ne peut pas encore t’envoyer de notification : Budj te le dit quand tu
          l’ouvres, une fois par jour au plus.
        </Text>
      </ListSection>

      <ListSection title="Préférences">
        <ListGroup>
          <MenuRow icon="edit" label="Thème" value={s.themeLabel} onClick={actions.chooseTheme} />
          <span id={STYLE_ROW_ID} className={styles.focusable}>
            <MenuRow
              icon="categories"
              label="Style d’UI"
              value={s.styleLabel}
              onClick={actions.chooseStyle}
            />
          </span>
          <SwitchRow
            label="Afficher les centimes"
            checked={s.settings.showCents}
            onChange={actions.setShowCents}
          />
          <Row title="Devise" trailing="Euro (€)" />
        </ListGroup>
      </ListSection>

      <ListSection title="Mes données">
        <ListGroup>
          <MenuRow icon="share" label="Exporter mes données" onClick={actions.exportData} />
          <MenuRow icon="history" label="Importer une sauvegarde" onClick={actions.importData} />
        </ListGroup>
        <Text variant="label-regular" color="secondary">
          Tes données restent uniquement sur ce téléphone. Exporte une sauvegarde de temps en
          temps : supprimer l’icône de l’écran d’accueil efface les données de l’app.
        </Text>
        {s.status && (
          <ListGroup>
            <Row title="Stockage protégé" trailing={s.status.persisted ? 'Oui' : 'Non'} />
            <Row title="App installée" trailing={s.status.installed ? 'Oui' : 'Non'} />
            {s.status.usage !== undefined && (
              <Row title="Espace utilisé" trailing={formatBytes(s.status.usage)} />
            )}
          </ListGroup>
        )}
      </ListSection>

      <InstallHelp />

      <ListGroup>
        <MenuRow icon="delete" label="Réinitialiser l’app" tone="danger" onClick={actions.reset} />
      </ListGroup>

      <ListSection title="À propos">
        <ListGroup>
          <Row title="Version" trailing={s.version} />
          <Row title="Écran (diagnostic)" subtitle={s.viewport} />
          <Row
            title="Confidentialité"
            subtitle="Pas de compte, pas de serveur, aucune donnée envoyée."
          />
        </ListGroup>
      </ListSection>
    </div>
  )
}
