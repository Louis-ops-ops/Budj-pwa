import { useState } from 'react'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { useIsMobile } from '../ui/useIsMobile'
import { Dialog } from '../components/Dialog'
import { SelectField } from '../components/Field'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { ListGroup, SwitchRow } from '../ui/shared/List'

const DAYS = Array.from({ length: 28 }, (_, i) => {
  const day = String(i + 1)
  return { value: day, label: i === 0 ? 'Le 1er du mois' : `Le ${day} du mois` }
})

/** Budget › Options › Début du mois (1–28). */
export function MonthStartDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const isMobile = useIsMobile()
  const current = useBudj((s) => s.data.settings.monthStartDay)
  const updateSettings = useBudj((s) => s.updateSettings)
  const toast = useUi((s) => s.toast)
  const [day, setDay] = useState(String(current))

  return (
    <Dialog
      title="Début du mois"
      onClose={onClose}
      onSubmit={() => {
        updateSettings({ monthStartDay: Number(day) })
        toast('Début du mois enregistré')
        onClose()
      }}
      submitLabel="Enregistrer"
      submitDisabled={Number(day) === current}
      footerStart={isMobile && <TextLink label="Annuler" onClick={onClose} />}
    >
      <SelectField label="Ton mois budgétaire commence" value={day} options={DAYS} onChange={setDay} />
      <Text variant="label-regular" color="secondary">
        Pratique si ton salaire tombe en fin de mois : avec le 25, ton mois de novembre va du 25
        novembre au 24 décembre. Tes dépenses passées sont reclassées en conséquence.
      </Text>
    </Dialog>
  )
}

/** Budget › Options › Report du reste. Louis: the leftover goes to savings. */
export function RolloverDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const current = useBudj((s) => s.data.settings.rolloverRemaining)
  const updateSettings = useBudj((s) => s.updateSettings)

  return (
    <Dialog title="Report du reste" onClose={onClose}>
      <ListGroup>
        <SwitchRow
          label="Reporter le reste vers l’épargne"
          checked={current}
          onChange={(rolloverRemaining) => updateSettings({ rolloverRemaining })}
        />
      </ListGroup>
      <Text variant="label-regular" color="secondary">
        Activé, ce qu’il te reste en fin de mois s’ajoute à ton épargne, en plus de ton objectif.
        Désactivé, seul l’objectif compte comme épargne.
      </Text>
      <TextLink label="Fermer" onClick={onClose} />
    </Dialog>
  )
}
