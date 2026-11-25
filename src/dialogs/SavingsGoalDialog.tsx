import { useState } from 'react'
import { todayISO } from '../data/dates'
import { amountTextToCents, centsToInput, formatEuroShort } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { AmountInput } from '../components/AmountInput'
import { Dialog } from '../components/Dialog'
import { Text } from '../components/Text'
import {
  AmountHint,
  ChoicePills,
  FormCard,
  SheetAmount,
  SheetBlock,
  ValueRow
} from '../ui/shared/SheetParts'

const SUGGESTIONS = [5000, 10000, 15000, 20000]

/** Figma: 12 · Gestion et objectif › Objectif d'épargne (429:6067). */
export function SavingsGoalDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const setSavingsGoal = useBudj((s) => s.setSavingsGoal)
  const toast = useUi((s) => s.toast)

  const month = sel.currentMonth(data, todayISO())
  const current = sel.savingsGoal(data, month)
  const [text, setText] = useState(current > 0 ? centsToInput(current) : '')
  const next = amountTextToCents(text)

  const budget = sel.monthBudget(data, month)
  const fixed = sel.fixedTotal(data, month)
  const forCategories = budget - fixed - next

  const submit = (): void => {
    setSavingsGoal(next)
    toast(next > 0 ? 'Objectif d’épargne enregistré' : 'Objectif d’épargne retiré')
    onClose()
  }

  return (
    <Dialog
      title="Objectif d’épargne"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Enregistrer l’objectif"
      submitDisabled={next === current}
    >
      <SheetAmount below={<AmountHint>mis de côté chaque 1er du mois</AmountHint>}>
        <AmountInput value={text} onChange={setText} label="Objectif d’épargne mensuel" autoFocus />
      </SheetAmount>

      <ChoicePills
        label="Suggestions"
        options={SUGGESTIONS.map((amount) => ({ value: amount, label: formatEuroShort(amount) }))}
        value={next}
        onChange={(amount) => setText(centsToInput(amount))}
      />

      <SheetBlock title="Ton mois avec cet objectif">
        <FormCard>
          <ValueRow label="Budget mensuel" value={formatEuroShort(budget)} />
          <ValueRow label="Dépenses fixes" value={`− ${formatEuroShort(fixed)}`} />
          <ValueRow label="Épargne" value={`− ${formatEuroShort(next)}`} tone="success" />
          <ValueRow
            label="Pour tes catégories"
            value={formatEuroShort(forCategories)}
            tone={forCategories < 0 ? 'danger' : undefined}
          />
        </FormCard>
      </SheetBlock>

      <Text variant="label-regular" color="secondary">
        {next > 0
          ? 'L’épargne est réservée dès le 1er, comme une dépense fixe : ton restant en tient déjà compte. Objectif tenu tant que le restant reste positif.'
          : 'Sans objectif, rien n’est mis de côté au début du mois.'}
      </Text>
    </Dialog>
  )
}
