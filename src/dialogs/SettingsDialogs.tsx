// Sheets of Réglages and their confirmations (Figma: 11 · Réglages — confirmations).
import { useState } from 'react'
import type { BudjData } from '../shared/types'
import { expensesToCsv } from '../data/csv'
import { addMonths, formatShortDay, todayISO } from '../data/dates'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { exportBackup } from '../platform/backup'
import { InvalidImportError, platform } from '../platform/storage'
import { useUi } from '../ui/uiStore'
import { Dialog } from '../components/Dialog'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { Circle, ListGroup, MenuRow, Row, SelectMenuRow } from '../ui/shared/List'
import { Callout, SheetBlock } from '../ui/shared/SheetParts'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { formatNumber } from '../data/money'
import styles from './Dialogs.module.css'

export interface Choice<T extends string> {
  value: T
  label: string
  hint?: string
}

/** One choice among a few (Thème, Style d'UI…): a tap selects and closes. */
export function ChoiceDialog<T extends string>({
  title,
  options,
  value,
  onSelect,
  note,
  onClose
}: {
  title: string
  options: Choice<T>[]
  value: T
  onSelect(value: T): void
  note?: string
  onClose(): void
}): React.JSX.Element {
  return (
    <Dialog title={title} onClose={onClose}>
      <ListGroup label={title}>
        {options.map((o) => (
          <Row
            key={o.value}
            title={o.label}
            subtitle={o.hint}
            selected={o.value === value}
            trailing={o.value === value ? <Icon name="check" size={20} /> : undefined}
            onClick={() => {
              onSelect(o.value)
              onClose()
            }}
          />
        ))}
      </ListGroup>
      {note && (
        <Text variant="label-regular" color="secondary">
          {note}
        </Text>
      )}
      <div className={styles.centerLink}>
        <TextLink label="Fermer" onClick={onClose} />
      </div>
    </Dialog>
  )
}

type Format = 'csv' | 'json'
type Period = 'month' | 'three' | 'all'

/** Réglages › Exporter: CSV (expenses) or JSON (full backup). */
export function ExportDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const toast = useUi((s) => s.toast)
  const [format, setFormat] = useState<Format>('csv')
  const [period, setPeriod] = useState<Period>('month')

  const today = todayISO()
  const month = sel.currentMonth(data, today)
  const from =
    period === 'all'
      ? undefined
      : sel.monthBounds(data, period === 'month' ? month : addMonths(month, -2)).first
  const count = data.expenses.filter((e) => from === undefined || e.date >= from).length

  const submit = (): void => {
    if (format === 'json') {
      void exportBackup().then((ok) => ok && onClose())
      return
    }
    const file = new File([expensesToCsv(data, from)], `budj-depenses-${today}.csv`, {
      type: 'text/csv;charset=utf-8'
    })
    // Straight from the click: iOS refuses the share sheet after an await.
    void platform.exportFile(file).then((ok) => {
      if (!ok) return
      toast('Dépenses exportées')
      onClose()
    })
  }

  return (
    <Dialog
      title="Exporter mes données"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Exporter et partager"
      submitDisabled={format === 'csv' && count === 0}
      cancelVisible
    >
      <SheetBlock title="Format">
        <ListGroup surface="surface" label="Format">
          <MenuRow
            icon={format === 'csv' ? 'check' : 'share'}
            label="CSV — pour Excel ou Sheets"
            value={format === 'csv' ? 'Choisi' : undefined}
            valueTone="brand"
            onClick={() => setFormat('csv')}
          />
          <MenuRow
            icon={format === 'json' ? 'check' : 'share'}
            label="JSON — sauvegarde complète"
            value={format === 'json' ? 'Choisi' : undefined}
            valueTone="brand"
            onClick={() => setFormat('json')}
          />
        </ListGroup>
      </SheetBlock>
      {format === 'csv' && (
        <SheetBlock title="Contenu">
          <ListGroup surface="surface" label="Contenu">
            <SelectMenuRow<Period>
              icon="calendar"
              label="Période"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'month', label: 'Ce mois' },
                { value: 'three', label: '3 derniers mois' },
                { value: 'all', label: 'Tout l’historique' }
              ]}
            />
            <Row
              leading={<Circle icon="history" />}
              title="Dépenses"
              trailing={String(count)}
            />
          </ListGroup>
        </SheetBlock>
      )}
    </Dialog>
  )
}

/** Réglages › Importer: preview of the chosen file, then « Remplacer mes données ». */
export function ImportPreviewDialog({
  data,
  onClose
}: {
  data: BudjData
  onClose(): void
}): React.JSX.Element {
  const replaceData = useBudj((s) => s.replaceData)
  const toast = useUi((s) => s.toast)
  const last = data.expenses.reduce<string | null>(
    (max, e) => (max === null || e.date > max ? e.date : max),
    null
  )
  const count = data.expenses.length

  const currentCount = useBudj((s) => s.data.expenses.length)

  return (
    <Dialog
      title="Importer une sauvegarde ?"
      onClose={onClose}
      onSubmit={() => {
        replaceData(data)
        toast('Données importées')
        onClose()
      }}
      submitLabel="Remplacer mes données"
      cancelVisible
    >
      <ListGroup surface="surface">
        <Row
          leading={<Avatar color="vert" initial="J" />}
          title="Sauvegarde Budj"
          subtitle={
            last
              ? `Dernière dépense le ${formatShortDay(last).toLocaleLowerCase('fr-FR')}`
              : 'Aucune dépense'
          }
          trailing={formatNumber(count)}
          trailingSub={count > 1 ? 'dépenses' : 'dépense'}
        />
      </ListGroup>
      <Callout icon="move" tone="brand">
        L’import remplace les données actuelles de ce téléphone ({formatNumber(currentCount)}{' '}
        dépense{currentCount > 1 ? 's' : ''}). Une copie de secours est gardée.
      </Callout>
    </Dialog>
  )
}

/** Réglages › Réinitialiser l'app. Keeps data-bak, then the onboarding starts again. */
export function ResetDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const resetApp = useBudj((s) => s.resetApp)
  const toast = useUi((s) => s.toast)

  return (
    <Dialog
      title="Réinitialiser l’app ?"
      onClose={onClose}
      onSubmit={() => {
        void platform.backupNow(data).finally(() => {
          resetApp()
          onClose()
          toast('Budj a été réinitialisé')
        })
      }}
      submitLabel="Tout effacer"
      submitVariant="danger"
      cancelVisible
    >
      <Callout icon="delete" tone="danger">
        Toutes tes dépenses, catégories, fixes et réglages seront effacés de ce téléphone.
      </Callout>
      <Text variant="body-regular" color="secondary">
        Exporte une sauvegarde avant si tu veux pouvoir les récupérer.
      </Text>
      <ListGroup surface="surface">
        <MenuRow
          icon="share"
          label="Exporter une sauvegarde d’abord"
          value="JSON"
          onClick={() => void exportBackup()}
        />
      </ListGroup>
    </Dialog>
  )
}

/** Réglages › Rappel du soir › Heure. */
export function ReminderTimeDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const reminders = useBudj((s) => s.data.settings.reminders)
  const updateSettings = useBudj((s) => s.updateSettings)
  const [time, setTime] = useState(reminders.eveningTime)
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(time)

  return (
    <Dialog
      title="Heure du rappel"
      onClose={onClose}
      onSubmit={() => {
        updateSettings({ reminders: { ...reminders, eveningTime: time } })
        onClose()
      }}
      submitLabel="Enregistrer"
      submitDisabled={!valid || time === reminders.eveningTime}
    >
      <label className={styles.group}>
        <Text variant="label-medium" color="secondary" as="span">
          Après cette heure, Budj te rappelle à l’ouverture de noter tes dépenses du jour.
        </Text>
        <input
          type="time"
          className={styles.timeInput}
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>
    </Dialog>
  )
}

/** Reads a backup file, then shows its preview (v3 §7.10). */
export async function pickImport(): Promise<void> {
  const { openDialog, toast } = useUi.getState()
  try {
    const data = await platform.importData()
    if (data) openDialog({ kind: 'importPreview', data })
  } catch (error) {
    toast(
      error instanceof InvalidImportError
        ? 'Ce fichier n’est pas une sauvegarde Budj valide'
        : 'Import impossible'
    )
  }
}
