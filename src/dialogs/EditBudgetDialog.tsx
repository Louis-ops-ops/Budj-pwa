import { useState } from 'react'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import * as sel from '../data/selectors'
import {
  amountTextToCents,
  centsToInput,
  formatEuro,
  formatEuroShort,
  formatEuroSigned,
  percent
} from '../data/money'
import { monthOf, todayISO } from '../data/dates'
import { Dialog } from '../components/Dialog'
import { AmountInput } from '../components/AmountInput'
import { CategoryChip } from '../components/Chip'
import { Gauge } from '../components/Gauge'
import { Text } from '../components/Text'
import { categoryPaint } from '../data/colors'
import { TextLink } from '../components/TextLink'
import { useIsMobile } from '../ui/useIsMobile'
import styles from './Dialogs.module.css'

const STEPS = [-5000, -1000, 1000, 5000]

interface EditBudgetDialogProps {
  /** Category budget when set, global monthly budget otherwise. */
  categoryId?: string
  onClose(): void
}

export function EditBudgetDialog({
  categoryId,
  onClose
}: EditBudgetDialogProps): React.JSX.Element | null {
  const isMobile = useIsMobile()
  const data = useBudj((s) => s.data)
  const setMonthlyBudget = useBudj((s) => s.setMonthlyBudget)
  const updateCategory = useBudj((s) => s.updateCategory)
  const toast = useUi((s) => s.toast)

  const month = monthOf(todayISO())
  const category = categoryId ? data.categories.find((c) => c.id === categoryId) : undefined
  const current = category ? category.monthlyBudget : sel.monthBudget(data, month)
  const [text, setText] = useState(current > 0 ? centsToInput(current) : '')

  if (categoryId && !category) return null

  const next = amountTextToCents(text)
  const diff = next - current
  const adjust = (step: number): void => setText(centsToInput(Math.max(0, next + step)))

  // "Spent" side of the preview: category spending, or fixed + variable for the global budget.
  const spent = category
    ? sel.categorySpent(data, month, category.id)
    : sel.fixedTotal(data, month) + sel.variableSpent(data, month)
  const remainingAfter = next - spent
  const ratio = next > 0 ? spent / next : spent > 0 ? Infinity : 0

  // Allocation check: never blocks, only warns.
  const allocatedAfter = category
    ? sel.allocatedBudget(data, month) - current + next
    : sel.allocatedBudget(data, month)
  const budgetAfter = category ? sel.monthBudget(data, month) : next
  const overAllocated = allocatedAfter - budgetAfter

  const submit = (): void => {
    if (category) updateCategory({ ...category, monthlyBudget: next })
    else setMonthlyBudget(next)
    toast('Budget enregistré')
    onClose()
  }

  return (
    <Dialog
      title="Modifier le budget"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Enregistrer le budget"
      submitDisabled={text === '' || diff === 0}
      footerStart={isMobile && <TextLink label="Annuler" onClick={onClose} />}
      headerExtra={
        category && (
          <CategoryChip
            label={category.name}
            color={categoryPaint(category)}
            selected
            onClick={() => undefined}
          />
        )
      }
    >
      <div className={styles.group}>
        <AmountInput
          value={text}
          onChange={setText}
          label={category ? `Budget ${category.name}` : 'Budget mensuel'}
          autoFocus
        />
        <Text variant="label-regular" className={styles.current}>
          Budget actuel :{' '}
          <strong className="t-label-bold tabular">{formatEuroShort(current)}</strong>
          {diff !== 0 && text !== '' && (
            <span className={diff > 0 ? styles.positive : styles.negative}>
              {' '}
              ({formatEuroSigned(diff)})
            </span>
          )}
        </Text>
        <div className={styles.quick} role="group" aria-label="Ajuster rapidement">
          {STEPS.map((step) => (
            <button
              key={step}
              type="button"
              className={`t-label-medium tabular ${styles.quickButton}`}
              onClick={() => adjust(step)}
            >
              {formatEuroSigned(step)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <Text variant="label-medium" className={styles.groupLabelMuted}>
          Après modification
        </Text>
        <div className={styles.preview}>
          <div className={styles.previewLine}>
            <Text variant="h3" as="span">
              {isMobile ? 'Budget total' : category ? 'Budget de la catégorie' : 'Budget du mois'}
            </Text>
            <Text variant="h3" as="span" tabular>
              {formatEuroShort(next)}
            </Text>
          </div>
          <div className={styles.previewLine}>
            <Text variant="body-medium" as="span">
              {category ? 'Dépensé' : 'Fixes + dépensé'}
            </Text>
            <Text
              variant="body-medium"
              as="span"
              tabular
              className={ratio > 1 ? styles.negative : styles.positive}
            >
              {formatEuro(spent)}
            </Text>
          </div>
          <Gauge
            ratio={ratio}
            fill={ratio > 1 ? 'bg-danger' : category ? categoryPaint(category).fg : 'bg-accent'}
            track={isMobile ? 'bg-brand-strong' : undefined}
            label={percent(Number.isFinite(ratio) ? ratio : 1)}
          />
        </div>
        <Text variant="label-regular" color="tertiary">
          {remainingAfter >= 0 ? (
            <>
              Il te restera{' '}
              <strong className={`t-label-bold tabular ${styles.positive}`}>
                {formatEuro(remainingAfter)}
              </strong>{' '}
              à dépenser
              {category ? ` en ${category.name}` : ''} ce mois-ci.
            </>
          ) : (
            <>
              Tu dépasses déjà ce budget de{' '}
              <strong className={`t-label-bold tabular ${styles.negative}`}>
                {formatEuro(-remainingAfter)}
              </strong>{' '}
              ce mois-ci.
            </>
          )}
        </Text>
        {overAllocated > 0 && (
          <Text variant="label-regular" className={styles.warning}>
            Tes catégories et dépenses fixes dépassent ton budget mensuel de{' '}
            {formatEuro(overAllocated)}.
          </Text>
        )}
      </div>
    </Dialog>
  )
}
