import { useState } from 'react'
import type { FixedExpense } from '../shared/types'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { amountTextToCents, centsToInput, formatEuro } from '../data/money'
import { monthOf, todayISO } from '../data/dates'
import { Dialog } from '../components/Dialog'
import { AmountInput } from '../components/AmountInput'
import { AddChip, CategoryChip, ChipList } from '../components/Chip'
import { SelectField, TextField } from '../components/Field'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { DayPicker } from '../components/DayPicker'
import { useIsMobile } from '../ui/useIsMobile'
import styles from './Dialogs.module.css'

const DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `Le ${i === 0 ? '1er' : i + 1}`
}))

interface FixedExpenseDialogProps {
  fixed?: FixedExpense
  dayOfMonth?: number
  onClose(): void
}

export function FixedExpenseDialog({
  fixed,
  dayOfMonth,
  onClose
}: FixedExpenseDialogProps): React.JSX.Element {
  const isMobile = useIsMobile()
  const data = useBudj((s) => s.data)
  const addFixedExpense = useBudj((s) => s.addFixedExpense)
  const updateFixedExpense = useBudj((s) => s.updateFixedExpense)
  const deleteFixedExpense = useBudj((s) => s.deleteFixedExpense)
  const openDialog = useUi((s) => s.openDialog)
  const toast = useUi((s) => s.toast)

  const [amount, setAmount] = useState(fixed ? centsToInput(fixed.amount) : '')
  const [label, setLabel] = useState(fixed?.label ?? '')
  const [day, setDay] = useState(String(fixed?.dayOfMonth ?? dayOfMonth ?? 1))
  const [subcategoryId, setSubcategoryId] = useState(
    fixed?.subcategoryId ??
      data.fixedSubcategories.find((s) => s.name === 'Factures')?.id ??
      data.fixedSubcategories[0]?.id ??
      ''
  )

  const cents = amountTextToCents(amount)
  const trimmed = label.trim()
  const valid = cents > 0 && trimmed !== '' && subcategoryId !== ''
  const dayNumber = Number(day)

  const submit = (): void => {
    if (!valid) return
    const fields = { label: trimmed, amount: cents, dayOfMonth: dayNumber, subcategoryId }
    if (fixed) {
      updateFixedExpense({ ...fixed, ...fields })
      toast('Dépense fixe modifiée')
    } else {
      addFixedExpense(fields)
      toast('Dépense fixe ajoutée')
    }
    onClose()
  }

  // Already counted in a past month: changes apply from this month on.
  const hasHistory = fixed !== undefined && fixed.startMonth < monthOf(todayISO())

  const remove = (): void => {
    if (!fixed) return
    const counted = fixed.startMonth < monthOf(todayISO())
    openDialog({
      kind: 'confirm',
      title: `Supprimer ${fixed.label} ?`,
      message: counted
        ? 'Elle ne comptera plus à partir de ce mois-ci. Les mois passés ne changent pas.'
        : 'Elle sera retirée de tes dépenses fixes.',
      confirmLabel: 'Supprimer',
      onConfirm: () => {
        deleteFixedExpense(fixed.id)
        toast('Dépense fixe supprimée')
        onClose()
      }
    })
  }

  return (
    <Dialog
      title={fixed ? 'Modifier la dépense fixe' : 'Nouvelle dépense fixe'}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={fixed ? 'Enregistrer' : 'Ajouter la dépense fixe'}
      submitDisabled={!valid}
      footerStart={
        fixed && <TextLink label="Supprimer" icon="delete" tone="danger" onClick={remove} />
      }
    >
      <div className={styles.group}>
        <AmountInput value={amount} onChange={setAmount} label="Montant mensuel" autoFocus />
        <Text variant="label-regular" className={styles.current}>
          {cents > 0 ? (
            <>
              Soit <strong className="t-label-bold tabular">{formatEuro(cents * 12)}</strong> par an
            </>
          ) : (
            'Montant prélevé chaque mois'
          )}
        </Text>
      </div>

      <div className={styles.row}>
        <TextField
          label="Libellé"
          value={label}
          onChange={setLabel}
          placeholder="Ex. Netflix"
          maxLength={40}
        />
        {!isMobile && (
          <div className={styles.paymentField}>
            <SelectField label="Jour du prélèvement" value={day} options={DAYS} onChange={setDay} />
          </div>
        )}
      </div>

      {isMobile && (
        <div className={styles.group}>
          <div className={styles.previewLine}>
            <Text variant="label-medium" color="brand" as="span">
              Jour du prélèvement
            </Text>
            <Text variant="label-regular" color="tertiary" as="span">
              Le {dayNumber === 1 ? '1er' : dayNumber} de chaque mois
            </Text>
          </div>
          <DayPicker value={dayNumber} onChange={(d) => setDay(String(d))} />
        </div>
      )}

      <div className={styles.group}>
        <Text variant="label-medium" className={styles.groupLabel}>
          Sous-catégorie
        </Text>
        <ChipList label="Sous-catégorie">
          {data.fixedSubcategories.map((s) => (
            <CategoryChip
              key={s.id}
              label={s.name}
              color="bleu"
              selected={s.id === subcategoryId}
              onClick={() => setSubcategoryId(s.id)}
            />
          ))}
          <AddChip
            label="Nouvelle"
            onClick={() =>
              openDialog({ kind: 'newSubcategory', onCreated: (id) => setSubcategoryId(id) })
            }
          />
        </ChipList>
      </div>

      {hasHistory && (
        <Text variant="label-regular" color="tertiary">
          Les changements s’appliquent à partir de ce mois-ci. Les mois passés gardent l’ancien
          montant.
        </Text>
      )}

      {valid && !isMobile && (
        <div className={styles.preview}>
          <div className={styles.previewLine}>
            <Text variant="body-medium" as="span">
              {trimmed}
            </Text>
            <Text variant="body-bold" as="span" tabular>
              {formatEuro(cents)}
            </Text>
          </div>
          <Text variant="label-regular" color="brand">
            Le {dayNumber === 1 ? '1er' : dayNumber} de chaque mois
            {dayNumber > 28 && ' (ou le dernier jour des mois plus courts)'} ·{' '}
            {data.fixedSubcategories.find((s) => s.id === subcategoryId)?.name}
          </Text>
        </div>
      )}
    </Dialog>
  )
}
