import { useState } from 'react'
import { categoryPaint } from '../data/colors'
import { todayISO } from '../data/dates'
import { PAYMENT_LABELS, formatExpenseDate } from '../data/format'
import { formatEuro } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { AddChip, CategoryChip, ChipList } from '../components/Chip'
import { Dialog } from '../components/Dialog'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import styles from './Dialogs.module.css'

/**
 * Figma: 12 · Dépenses à catégoriser (429:6257). One expense at a time: a tap on
 * a category files it and shows the next one. At the end, closes with a toast.
 */
export function SortUncategorizedDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const moveExpenses = useBudj((s) => s.moveExpenses)
  const openDialog = useUi((s) => s.openDialog)
  const toast = useUi((s) => s.toast)

  const today = todayISO()
  // The queue is fixed when the sheet opens: filed expenses leave it, skipped ones stay out.
  const [queue] = useState(() =>
    sel.uncategorized(data, sel.currentMonth(data, today)).map((e) => e.id)
  )
  const [index, setIndex] = useState(0)
  const [filed, setFiled] = useState(0)

  const expense = data.expenses.find((e) => e.id === queue[index])
  const categories = sel.orderedCategories(data)

  const next = (didFile: boolean): void => {
    const total = filed + (didFile ? 1 : 0)
    setFiled(total)
    if (index + 1 >= queue.length) {
      onClose()
      toast(
        total === 0
          ? 'Aucune dépense rangée'
          : `${total} dépense${total > 1 ? 's' : ''} rangée${total > 1 ? 's' : ''}`
      )
      return
    }
    setIndex(index + 1)
  }

  const file = (categoryId: string): void => {
    if (!expense) return
    moveExpenses([expense.id], categoryId)
    next(true)
  }

  if (queue.length === 0 || !expense) {
    return (
      <Dialog title="À catégoriser" onClose={onClose}>
        <Text variant="body-regular" color="secondary">
          Toutes tes dépenses de ce mois sont rangées.
        </Text>
        <div className={styles.centerLink}>
          <TextLink label="Fermer" onClick={onClose} />
        </div>
      </Dialog>
    )
  }

  const details = [
    formatExpenseDate(expense.date, today),
    expense.paymentMethod ? PAYMENT_LABELS[expense.paymentMethod] : null
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Dialog
      title="À catégoriser"
      onClose={onClose}
    >
      <div className={styles.sortProgress}>
        <Text variant="label-medium" color="secondary" as="span" aria-live="polite">
          {index + 1} sur {queue.length}
        </Text>
        <span className={styles.sortDots} aria-hidden="true">
          {queue.map((q, i) => (
            <span key={q} className={styles.sortDot} data-current={i === index || undefined} />
          ))}
        </span>
      </div>
      <div className={styles.sortCard} key={expense.id}>
        <span className={styles.sortAvatar} aria-hidden="true">
          ?
        </span>
        <Text variant="h2" as="p">
          {expense.label || 'Dépense'}
        </Text>
        <Text variant="display-m" as="p" tabular>
          {formatEuro(expense.amount)}
        </Text>
        <Text variant="label-regular" color="secondary" as="p">
          {details}
        </Text>
      </div>

      <div className={styles.group}>
        <Text variant="label-medium" color="secondary">
          Touche une catégorie pour la ranger
        </Text>
        <ChipList label="Catégories">
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              color={categoryPaint(c)}
              selected={false}
              onClick={() => file(c.id)}
            />
          ))}
          <AddChip
            label="Nouvelle"
            onClick={() => openDialog({ kind: 'newCategory', onCreated: (id) => file(id) })}
          />
        </ChipList>
      </div>

      <div className={styles.centerLink}>
        <TextLink label="Passer cette dépense" onClick={() => next(false)} />
      </div>
    </Dialog>
  )
}
