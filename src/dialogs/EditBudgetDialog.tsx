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
import { todayISO } from '../data/dates'
import { Dialog } from '../components/Dialog'
import { AmountInput } from '../components/AmountInput'
import { CategoryChip } from '../components/Chip'
import { Gauge } from '../components/Gauge'
import { Text } from '../components/Text'
import { categoryPaint } from '../data/colors'
import { TextLink } from '../components/TextLink'
import { useIsMobile } from '../ui/useIsMobile'
import {
  FormCard,
  Note,
  QuickSteps,
  SheetAmount,
  SheetBlock,
  ValueRow
} from '../ui/shared/SheetParts'
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

  const month = sel.currentMonth(data, todayISO())
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

  if (isMobile) {
    const breakdown = sel.budgetBreakdown(data, month)
    const toAllocate = next - breakdown.fixed - breakdown.savings - breakdown.categories
    return (
      <Dialog
        title={category ? `Budget de ${category.name}` : 'Budget mensuel'}
        onClose={onClose}
        onSubmit={submit}
        submitLabel="Enregistrer"
        submitDisabled={text === '' || diff === 0}
      >
        <SheetAmount
          below={
            <span className={styles.currentLine}>
              <Text variant="label-regular" color="secondary" as="span" tabular>
                Budget actuel : {formatEuroShort(current)}
              </Text>
              {diff !== 0 && text !== '' && (
                <Note live tone={diff > 0 ? 'success' : 'danger'}>
                  {formatEuroSigned(diff)}
                </Note>
              )}
            </span>
          }
        >
          <AmountInput
            value={text}
            onChange={setText}
            label={category ? `Budget ${category.name}` : 'Budget mensuel'}
            autoFocus
          />
        </SheetAmount>
        <QuickSteps steps={STEPS} format={formatEuroSigned} onStep={adjust} />
        <SheetBlock title="Après modification">
          {category ? (
            <FormCard>
              <ValueRow label="Dépensé ce mois" value={formatEuroShort(spent)} />
              <ValueRow
                label="Il restera"
                value={formatEuroShort(remainingAfter)}
                tone={remainingAfter >= 0 ? 'success' : 'danger'}
              />
              <ValueRow
                label="Budget réparti"
                value={`${formatEuroShort(allocatedAfter)} / ${formatEuroShort(budgetAfter)}`}
                tone={overAllocated > 0 ? 'danger' : undefined}
              />
            </FormCard>
          ) : (
            <FormCard>
              <ValueRow label="Dépenses fixes" value={formatEuroShort(breakdown.fixed)} />
              <ValueRow label="Objectif d’épargne" value={formatEuroShort(breakdown.savings)} />
              <ValueRow label="Catégories" value={formatEuroShort(breakdown.categories)} />
              <ValueRow
                label={toAllocate >= 0 ? 'Reste à répartir' : 'Dépassement'}
                value={formatEuroShort(Math.abs(toAllocate))}
                tone={toAllocate >= 0 ? 'success' : 'danger'}
              />
            </FormCard>
          )}
        </SheetBlock>
      </Dialog>
    )
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
