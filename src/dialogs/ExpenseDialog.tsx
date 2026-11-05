import { useState, type CSSProperties } from 'react'
import type { Expense, PaymentMethod } from '../shared/types'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { expenseImpact } from '../data/selectors'
import {
  amountTextToCents,
  centsToInput,
  formatEuro,
  formatEuroShort,
  sanitizeAmountText
} from '../data/money'
import { addMonths, monthOf, todayISO } from '../data/dates'
import { Dialog } from '../components/Dialog'
import { AmountInput } from '../components/AmountInput'
import { AddChip, CategoryChip, ChipList } from '../components/Chip'
import { DateChip, DateField, SelectField, TextField } from '../components/Field'
import { IconButton } from '../components/IconButton'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { PAYMENT_LABELS, formatExpenseDate } from '../data/format'
import { categoryPaint } from '../data/colors'
import { useIsMobile } from '../ui/useIsMobile'
import styles from './Dialogs.module.css'

interface ExpenseDialogProps {
  categoryId?: string | null
  expense?: Expense
  onClose(): void
}

interface Line {
  key: number
  amount: string
  categoryId: string | null
  label: string
}

let lineKey = 1
// Keeps the dialog within the smallest window without scrolling.
const MAX_LINES = 7

export function ExpenseDialog({
  categoryId: presetCategory,
  expense,
  onClose
}: ExpenseDialogProps): React.JSX.Element {
  const isMobile = useIsMobile()
  const data = useBudj((s) => s.data)
  const addExpenses = useBudj((s) => s.addExpenses)
  const updateExpense = useBudj((s) => s.updateExpense)
  const openDialog = useUi((s) => s.openDialog)
  const toast = useUi((s) => s.toast)

  const today = todayISO()
  const [lines, setLines] = useState<Line[]>([
    {
      key: lineKey++,
      amount: expense ? centsToInput(expense.amount) : '',
      categoryId: expense ? expense.categoryId : (presetCategory ?? null),
      label: expense?.label ?? ''
    }
  ])
  const [multiple, setMultiple] = useState(false)
  const [date, setDate] = useState(expense?.date ?? today)
  const [payment, setPayment] = useState<PaymentMethod | 'none'>(expense?.paymentMethod ?? 'none')

  const update = (key: number, patch: Partial<Line>): void =>
    setLines((all) => all.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const addLine = (): void => {
    if (lines.length >= MAX_LINES) return
    setMultiple(true)
    setLines((all) => [
      ...all,
      { key: lineKey++, amount: '', categoryId: all[all.length - 1].categoryId, label: '' }
    ])
  }
  const categoryOf = (id: string | null): (typeof data.categories)[number] | undefined =>
    data.categories.find((c) => c.id === id)

  const cents = lines.map((l) => amountTextToCents(l.amount))
  const total = cents.reduce((a, b) => a + b, 0)
  const valid = cents.every((c) => c > 0)

  const toExpense = (line: Line, amount: number): Omit<Expense, 'id' | 'updatedAt'> => {
    const category = categoryOf(line.categoryId)
    return {
      amount,
      label: line.label.trim() || category?.name || 'Dépense',
      categoryId: category ? category.id : null,
      date,
      ...(payment !== 'none' ? { paymentMethod: payment } : {})
    }
  }

  const submit = (): void => {
    if (!valid) return
    if (expense) {
      const { paymentMethod: _drop, ...rest } = expense
      void _drop
      updateExpense({ ...rest, ...toExpense(lines[0], cents[0]) })
      toast('Dépense modifiée')
    } else {
      addExpenses(lines.map((l, i) => toExpense(l, cents[i])))
      toast(lines.length > 1 ? `${lines.length} dépenses ajoutées` : 'Dépense ajoutée')
    }
    onClose()
  }

  const details = (
    <div className={styles.row}>
      {!multiple && (
        <TextField
          label="Libellé"
          value={lines[0].label}
          onChange={(label) => update(lines[0].key, { label })}
          placeholder={categoryOf(lines[0].categoryId)?.name ?? 'Ex. Carrefour'}
          maxLength={60}
        />
      )}
      <DateField
        label="Date"
        value={date}
        display={formatExpenseDate(date, today)}
        onChange={setDate}
        max={`${addMonths(monthOf(today), 12)}-01`}
      />
      <div className={styles.paymentField}>
        <SelectField<PaymentMethod | 'none'>
          label="Paiement"
          value={payment}
          onChange={setPayment}
          options={(Object.keys(PAYMENT_LABELS) as (PaymentMethod | 'none')[]).map((value) => ({
            value,
            label: PAYMENT_LABELS[value]
          }))}
        />
      </div>
    </div>
  )

  const chips = (line: Line): React.JSX.Element => (
    <ChipList label="Catégorie">
      {data.categories.map((c) => (
        <CategoryChip
          key={c.id}
          label={c.name}
          color={categoryPaint(c)}
          selected={c.id === line.categoryId}
          onClick={() => update(line.key, { categoryId: c.id === line.categoryId ? null : c.id })}
        />
      ))}
      <AddChip
        label="Nouvelle"
        onClick={() =>
          openDialog({
            kind: 'newCategory',
            onCreated: (id) => update(line.key, { categoryId: id })
          })
        }
      />
    </ChipList>
  )

  if (multiple && isMobile) {
    const full = lines.length >= MAX_LINES
    return (
      <Dialog
        title="Nouvelles dépenses"
        onClose={onClose}
        onSubmit={submit}
        submitLabel={`Ajouter les ${lines.length} dépenses`}
        submitIcon="add"
        submitDisabled={!valid}
        headerExtra={
          <DateChip
            value={date}
            display={formatExpenseDate(date, today)}
            onChange={setDate}
            max={`${addMonths(monthOf(today), 12)}-01`}
          />
        }
        footerStart={
          <TextLink
            label="Ajouter une autre dépense"
            icon="add"
            onClick={addLine}
            disabled={full}
          />
        }
      >
        {lines.map((line, i) => (
          <div
            key={line.key}
            className={styles.lineCard}
            role="group"
            aria-label={`Dépense ${i + 1}`}
          >
            <div className={styles.previewLine}>
              <div className={styles.lineCardAmount}>
                <Text variant="label-regular" color="tertiary" as="span">
                  Dépense {i + 1}
                </Text>
                <span className={styles.lineCardInput}>
                  <input
                    className={`t-h1 tabular ${styles.lineCardField}`}
                    value={line.amount}
                    placeholder="0"
                    inputMode="decimal"
                    aria-label={`Montant de la dépense ${i + 1}`}
                    autoFocus={i === lines.length - 1 && i > 0}
                    onChange={(e) =>
                      update(line.key, { amount: sanitizeAmountText(e.target.value) })
                    }
                  />
                  <Text variant="body-regular" color="tertiary" as="span">
                    €
                  </Text>
                </span>
              </div>
              {i > 0 && (
                <IconButton
                  icon="delete"
                  label={`Retirer la dépense ${i + 1}`}
                  onClick={() => setLines((all) => all.filter((l) => l.key !== line.key))}
                />
              )}
            </div>
            <TextField
              label="Libellé"
              value={line.label}
              onChange={(label) => update(line.key, { label })}
              placeholder={categoryOf(line.categoryId)?.name ?? 'Ex. Carrefour'}
              maxLength={60}
            />
            {chips(line)}
          </div>
        ))}
        <div className={styles.previewLine}>
          <Text variant="body-regular" color="tertiary" as="span">
            Total
          </Text>
          <Text variant="h3" as="span" tabular>
            {formatEuro(total)}
          </Text>
        </div>
      </Dialog>
    )
  }

  if (multiple) {
    const full = lines.length >= MAX_LINES
    return (
      <Dialog
        title="Plusieurs dépenses"
        onClose={onClose}
        onSubmit={submit}
        submitLabel={`Ajouter les ${lines.length} dépenses`}
        submitDisabled={!valid}
        footerStart={
          <TextLink
            label="Ajouter une autre"
            icon="add"
            onClick={addLine}
            disabled={full}
            title={full ? `${MAX_LINES} dépenses maximum par ajout` : undefined}
          />
        }
      >
        <div className={styles.lines}>
          <div className={`t-label-medium ${styles.lineRow} ${styles.lineHead}`} aria-hidden="true">
            <span className={styles.lineAmount}>Montant</span>
            <span className={styles.lineLabel}>Libellé</span>
            <span className={styles.lineCategory}>Catégorie</span>
            <span className={styles.lineAction} />
          </div>
          {lines.map((line, i) => {
            const category = categoryOf(line.categoryId)
            const paint = category ? categoryPaint(category) : null
            return (
              <div
                key={line.key}
                className={styles.lineRow}
                role="group"
                aria-label={`Dépense ${i + 1}`}
              >
                <div className={`${styles.cell} ${styles.lineAmount}`}>
                  <input
                    className={`${styles.cellInput} tabular`}
                    value={line.amount}
                    placeholder="0"
                    inputMode="decimal"
                    aria-label={`Montant de la dépense ${i + 1}`}
                    autoFocus={i === lines.length - 1 && i > 0}
                    onChange={(e) =>
                      update(line.key, { amount: sanitizeAmountText(e.target.value) })
                    }
                  />
                  <span className={styles.cellSuffix}>€</span>
                </div>
                <div className={`${styles.cell} ${styles.lineLabel}`}>
                  <input
                    className={styles.cellInput}
                    value={line.label}
                    placeholder={category?.name ?? 'Ex. Carrefour'}
                    maxLength={60}
                    aria-label={`Libellé de la dépense ${i + 1}`}
                    onChange={(e) => update(line.key, { label: e.target.value })}
                  />
                </div>
                <div className={`${styles.cell} ${styles.lineCategory}`}>
                  <span
                    className={styles.cellDot}
                    style={paint ? { background: paint.fg } : undefined}
                    aria-hidden="true"
                  />
                  <select
                    className={`${styles.cellInput} ${styles.cellSelect}`}
                    value={line.categoryId ?? ''}
                    aria-label={`Catégorie de la dépense ${i + 1}`}
                    onChange={(e) => update(line.key, { categoryId: e.target.value || null })}
                  >
                    <option value="">À catégoriser</option>
                    {data.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <span className={styles.lineAction}>
                  {i > 0 && (
                    <IconButton
                      icon="delete"
                      tone="danger"
                      label={`Retirer la dépense ${i + 1}`}
                      onClick={() => setLines((all) => all.filter((l) => l.key !== line.key))}
                    />
                  )}
                </span>
              </div>
            )
          })}
        </div>
        {details}
        <div className={styles.previewLine}>
          <Text variant="body-medium" as="span">
            Total
          </Text>
          <Text variant="h3" as="span" tabular>
            {formatEuro(total)}
          </Text>
        </div>
      </Dialog>
    )
  }

  const line = lines[0]
  const category = categoryOf(line.categoryId)

  if (isMobile) {
    const impact = category
      ? expenseImpact(data, monthOf(date), category.id, cents[0], expense?.id)
      : null
    return (
      <Dialog
        title={expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
        onClose={onClose}
        onSubmit={submit}
        submitLabel={expense ? 'Enregistrer' : 'Ajouter la dépense'}
        submitIcon={expense ? undefined : 'add'}
        submitDisabled={!valid}
        headerExtra={
          <DateChip
            value={date}
            display={formatExpenseDate(date, today)}
            onChange={setDate}
            max={`${addMonths(monthOf(today), 12)}-01`}
          />
        }
        footerStart={
          !expense && <TextLink label="Ajouter une autre dépense" icon="add" onClick={addLine} />
        }
      >
        <div className={styles.amountBlock}>
          <AmountInput
            value={line.amount}
            onChange={(amount) => update(line.key, { amount })}
            label="Montant"
            autoFocus
          />
          {impact && category && (
            <Text
              variant="label-regular"
              color={impact.over ? 'danger' : 'secondary'}
              className={styles.impactSentence}
              aria-live="polite"
            >
              {impact.over ? 'Dépassement de ' : 'Il restera '}
              <strong style={impact.over ? undefined : { color: categoryPaint(category).fg }}>
                {formatEuro(Math.abs(impact.remainingAfter))}
              </strong>
              {' sur '}
              {category.name}
            </Text>
          )}
        </div>
        <TextField
          label="Libellé"
          value={line.label}
          onChange={(label) => update(line.key, { label })}
          placeholder={category?.name ?? 'Ex. Carrefour'}
          maxLength={60}
        />
        <div className={styles.group}>
          <Text variant="label-medium" color="brand">
            Catégorie
          </Text>
          {chips(line)}
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog
      title={expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={expense ? 'Enregistrer' : 'Ajouter la dépense'}
      submitDisabled={!valid}
      footerStart={!expense && <TextLink label="Ajouter une autre" icon="add" onClick={addLine} />}
    >
      <AmountInput
        value={line.amount}
        onChange={(amount) => update(line.key, { amount })}
        label="Montant"
        autoFocus
      />

      <div className={styles.group}>
        <Text variant="label-medium" className={styles.groupLabel}>
          Catégorie
        </Text>
        {chips(line)}
        {category ? (
          <ImpactPreview
            categoryId={category.id}
            amount={cents[0]}
            month={monthOf(date)}
            excludeExpenseId={expense?.id}
          />
        ) : (
          <Text variant="label-regular" color="secondary">
            Sans catégorie, la dépense ira dans « À catégoriser ».
          </Text>
        )}
      </div>

      {details}
    </Dialog>
  )
}

interface ImpactPreviewProps {
  categoryId: string
  amount: number
  month: string
  excludeExpenseId?: string
}

/** "Après cette dépense, il restera X € sur Y €" with a before/after gauge. */
export function ImpactPreview({
  categoryId,
  amount,
  month,
  excludeExpenseId
}: ImpactPreviewProps): React.JSX.Element | null {
  const data = useBudj((s) => s.data)
  const category = data.categories.find((c) => c.id === categoryId)
  const impact = expenseImpact(data, month, categoryId, amount, excludeExpenseId)
  if (!category || !impact) return null

  const base = Math.max(impact.budget, impact.spentBefore + amount, 1)
  const spentWidth = (impact.spentBefore / base) * 100
  const thisWidth = (amount / base) * 100
  const style = {
    '--impact-bg': categoryPaint(category).bg,
    '--impact-fg': categoryPaint(category).fg
  } as CSSProperties

  return (
    <div className={styles.impact} style={style} aria-live="polite">
      <div className={`t-label-regular ${styles.impactLine}`}>
        {impact.over ? (
          <>
            <span className={styles.impactOver}>Dépassement de</span>
            <span className={`${styles.impactValue} ${styles.impactOver}`}>
              <strong className="t-label-bold tabular">{formatEuro(-impact.remainingAfter)}</strong>
              <span>
                sur {formatEuroShort(impact.budget)} · {category.name}
              </span>
            </span>
          </>
        ) : (
          <>
            <span>Après cette dépense, il restera</span>
            <span className={styles.impactValue}>
              <strong className="t-label-bold tabular">{formatEuro(impact.remainingAfter)}</strong>
              <span>
                sur {formatEuroShort(impact.budget)} · {category.name}
              </span>
            </span>
          </>
        )}
      </div>
      <div
        className={[styles.impactTrack, impact.over ? styles.impactTrackOver : ''].join(' ')}
        aria-hidden="true"
      >
        <div className={styles.impactSpent} style={{ width: `${spentWidth}%` }} />
        <div className={styles.impactThis} style={{ width: `${thisWidth}%` }} />
      </div>
    </div>
  )
}
