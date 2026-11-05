import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import type { Expense, PaymentMethod } from '../shared/types'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import * as sel from '../data/selectors'
import { formatEuro } from '../data/money'
import { PAYMENT_LABELS, initialOf } from '../data/format'
import { formatDayMonth, formatLongDay, formatMonthName, monthOf, todayISO } from '../data/dates'
import { AsideColumn, MainColumn, Page } from '../layout/Page'
import { HistoryMobile } from './HistoryMobile'
import { useIsMobile } from '../ui/useIsMobile'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { AddChip, CategoryChip, ChipList } from '../components/Chip'
import { EmptyState } from '../components/EmptyState'
import { ExpenseRow } from '../components/ExpenseRow'
import { DateField, SelectField, TextField } from '../components/Field'
import { IconButton } from '../components/IconButton'
import { MonthPicker } from '../components/MonthPicker'
import { Text } from '../components/Text'
import { categoryPaint } from '../data/colors'
import styles from './History.module.css'

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`

/** True when the keyboard event comes from a text field (shortcuts must not fire). */
const inField = (e: KeyboardEvent): boolean => {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')
}

export function History(): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const deleteExpenses = useBudj((s) => s.deleteExpenses)
  const month = useUi((s) => s.month)
  const setMonth = useUi((s) => s.setMonth)
  const openDialog = useUi((s) => s.openDialog)
  const toast = useUi((s) => s.toast)
  const location = useLocation()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<sel.HistoryFilter>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const searchRef = useRef<HTMLInputElement>(null)
  const today = todayISO()

  const monthExpenses = sel.expensesOfMonth(data, month)
  const uncategorized = sel.uncategorizedCount(data, month)
  const activeFilter = filter === 'none' && uncategorized === 0 ? null : filter
  const visible = useMemo(
    () => sel.groupByDay(sel.filterExpenses(monthExpenses, query, activeFilter)),
    [monthExpenses, query, activeFilter]
  )
  const flat = visible.flatMap((g) => g.expenses)
  const selected = flat.find((e) => e.id === selectedId) ?? flat[0]

  // Ctrl K (from anywhere) lands here with focusSearch in the navigation state.
  const focusToken = (location.state as { focusSearch?: number } | null)?.focusSearch
  useEffect(() => {
    if (focusToken) searchRef.current?.focus()
  }, [focusToken])

  const confirmDelete = (e: Expense): void =>
    openDialog({
      kind: 'confirm',
      title: 'Supprimer cette dépense ?',
      message: `${e.label} · ${formatEuro(e.amount)}. Cette action est définitive.`,
      confirmLabel: 'Supprimer',
      onConfirm: () => {
        const index = flat.findIndex((x) => x.id === e.id)
        setSelectedId(flat[index + 1]?.id ?? flat[index - 1]?.id ?? null)
        deleteExpenses([e.id])
        toast('Dépense supprimée')
      }
    })

  // ↑ ↓ change the selected expense, Suppr deletes it, Escape clears the search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (useUi.getState().dialogs.length > 0) return
      if (e.key === 'Escape' && query !== '') {
        setQuery('')
        return
      }
      if (inField(e) || !selected) return
      const index = flat.findIndex((x) => x.id === selected.id)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const next =
          flat[Math.min(Math.max(index + (e.key === 'ArrowDown' ? 1 : -1), 0), flat.length - 1)]
        setSelectedId(next.id)
        document.getElementById(`expense-${next.id}`)?.scrollIntoView({ block: 'nearest' })
      } else if (e.key === 'Delete') {
        e.preventDefault()
        confirmDelete(selected)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const total = sel.variableSpent(data, month)
  const categoryOf = (id: string | null): (typeof data.categories)[number] | undefined =>
    data.categories.find((c) => c.id === id)

  if (isMobile) {
    return (
      <HistoryMobile
        month={month}
        today={today}
        onMonth={setMonth}
        panel={(expense, close) => (
          <ExpensePanel
            key={expense.id}
            expense={expense}
            today={today}
            onDelete={() => {
              close()
              confirmDelete(expense)
            }}
          />
        )}
      />
    )
  }

  return (
    <Page
      title="Historique"
      subtitle={`${formatEuro(total)} dépensés en ${formatMonthName(month)} · ${plural(monthExpenses.length, 'dépense', 'dépenses')}`}
      actions={
        <>
          <div className={styles.search}>
            <input
              ref={searchRef}
              className={styles.searchInput}
              value={query}
              placeholder="Rechercher une dépense…"
              aria-label="Rechercher une dépense"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && query !== '') {
                  e.stopPropagation()
                  setQuery('')
                }
              }}
            />
            {query ? (
              <button
                type="button"
                className={`t-label-medium ${styles.clear}`}
                onClick={() => setQuery('')}
              >
                Effacer
              </button>
            ) : (
              <span className={`t-caption-medium ${styles.kbd}`}>Ctrl K</span>
            )}
          </div>
          <MonthPicker
            value={month}
            months={sel.availableMonths(data, today)}
            onChange={setMonth}
          />
        </>
      }
    >
      <MainColumn>
        <div className={styles.filters}>
          <ChipList label="Filtrer par catégorie">
            <CategoryChip
              label="Toutes"
              color="bleu"
              selected={activeFilter === null}
              onClick={() => setFilter(null)}
            />
            {data.categories.map((c) => (
              <CategoryChip
                key={c.id}
                label={c.name}
                color={categoryPaint(c)}
                selected={activeFilter === c.id}
                onClick={() => setFilter(activeFilter === c.id ? null : c.id)}
              />
            ))}
          </ChipList>
          {uncategorized > 0 && (
            <button
              type="button"
              aria-pressed={activeFilter === 'none'}
              className={`t-label-medium ${styles.uncategorized} ${activeFilter === 'none' ? styles.uncategorizedActive : ''}`}
              onClick={() => setFilter(activeFilter === 'none' ? null : 'none')}
            >
              <span className={`t-caption-medium ${styles.badge}`}>{uncategorized}</span>À
              catégoriser
            </button>
          )}
        </div>

        {monthExpenses.length === 0 ? (
          <EmptyState
            title="Aucune dépense ce mois-ci"
            message="Ajoute ta première dépense pour la retrouver ici."
            actionLabel="Nouvelle dépense"
            onAction={() => openDialog({ kind: 'expense' })}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="Aucun résultat"
            message={
              query
                ? `Aucune dépense ne correspond à « ${query} ».`
                : 'Aucune dépense dans ce filtre.'
            }
            actionLabel={query ? 'Effacer la recherche' : 'Voir toutes les dépenses'}
            actionIcon={null}
            onAction={() => {
              setQuery('')
              setFilter(null)
            }}
          />
        ) : (
          <div className={styles.table} role="listbox" aria-label="Dépenses du mois">
            {visible.map((g) => (
              <div key={g.date} role="group" aria-label={formatLongDay(g.date)}>
                <div className={styles.day}>
                  <Text variant="body-bold" as="span">
                    {formatLongDay(g.date)}
                  </Text>
                  <Text variant="label-regular" color="brand-faint" as="span" tabular>
                    {formatEuro(-g.total)}
                  </Text>
                </div>
                {g.expenses.map((e) => {
                  const cat = categoryOf(e.categoryId)
                  const detail = [
                    cat?.name ?? 'À catégoriser',
                    e.paymentMethod && PAYMENT_LABELS[e.paymentMethod]
                  ]
                    .filter(Boolean)
                    .join(' · ')
                  return (
                    <div
                      key={e.id}
                      id={`expense-${e.id}`}
                      role="option"
                      aria-selected={selected?.id === e.id}
                    >
                      <ExpenseRow
                        label={e.label}
                        detail={detail}
                        detailColor={cat ? undefined : 'text-brand'}
                        amount={formatEuro(-e.amount)}
                        amountColor={cat ? categoryPaint(cat).fg : 'text-primary'}
                        avatar={
                          <Avatar
                            color={cat ? categoryPaint(cat) : 'uncategorized'}
                            initial={cat ? initialOf(e.label) : '?'}
                          />
                        }
                        selected={selected?.id === e.id}
                        outlined
                        onClick={() => setSelectedId(e.id)}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </MainColumn>

      <AsideColumn wide>
        {selected && (
          <ExpensePanel
            key={selected.id}
            expense={selected}
            today={today}
            onDelete={() => confirmDelete(selected)}
          />
        )}
      </AsideColumn>
    </Page>
  )
}

interface ExpensePanelProps {
  expense: Expense
  today: string
  onDelete(): void
}

/** Right panel: edit category, label, date and payment method of the selected expense. */
function ExpensePanel({ expense, today, onDelete }: ExpensePanelProps): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const updateExpense = useBudj((s) => s.updateExpense)
  const openDialog = useUi((s) => s.openDialog)
  const toast = useUi((s) => s.toast)

  const [categoryId, setCategoryId] = useState<string | null>(expense.categoryId)
  const [label, setLabel] = useState(expense.label)
  const [date, setDate] = useState(expense.date)
  const [payment, setPayment] = useState<PaymentMethod | 'none'>(expense.paymentMethod ?? 'none')

  const category = data.categories.find((c) => c.id === categoryId)
  const changed =
    categoryId !== expense.categoryId ||
    label.trim() !== expense.label ||
    date !== expense.date ||
    payment !== (expense.paymentMethod ?? 'none')
  const impact =
    category && categoryId !== expense.categoryId
      ? sel.expenseImpact(data, monthOf(date), category.id, expense.amount, expense.id)
      : null

  const save = (): void => {
    const { paymentMethod: _drop, ...rest } = expense
    void _drop
    updateExpense({
      ...rest,
      categoryId,
      label: label.trim() || expense.label,
      date,
      ...(payment !== 'none' ? { paymentMethod: payment } : {})
    })
    toast('Dépense enregistrée')
  }

  return (
    <section className={styles.panel} aria-label="Détail de la dépense">
      <div className={styles.panelHead}>
        <Avatar
          color={category ? categoryPaint(category) : 'uncategorized'}
          initial={category ? initialOf(expense.label) : '?'}
        />
        <div className={styles.panelTitles}>
          <Text variant="h3" as="h2">
            {expense.label}
          </Text>
          <Text variant="label-regular" color="secondary">
            {formatLongDay(expense.date)}
          </Text>
        </div>
      </div>

      <div className={styles.amount}>
        <Text variant="display-m" tabular>
          {formatEuro(expense.amount)}
        </Text>
        <IconButton
          icon="edit"
          label="Modifier le montant"
          onClick={() => openDialog({ kind: 'expense', expense })}
        />
      </div>

      <div className={styles.group}>
        <Text variant="label-medium" color="tertiary">
          Catégorie
        </Text>
        <ChipList label="Catégorie">
          {data.categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              color={categoryPaint(c)}
              selected={c.id === categoryId}
              onClick={() => setCategoryId(c.id === categoryId ? null : c.id)}
            />
          ))}
          <AddChip
            label="Nouvelle"
            onClick={() => openDialog({ kind: 'newCategory', onCreated: setCategoryId })}
          />
        </ChipList>
        {impact && category && (
          <Text
            variant="label-medium"
            className={`${styles.banner} ${impact.over ? styles.bannerOver : styles.bannerOk}`}
          >
            {impact.over
              ? `${category.name} passerait à ${formatEuro(-impact.remainingAfter)} de dépassement`
              : `Il resterait ${formatEuro(impact.remainingAfter)} sur ${category.name}`}
          </Text>
        )}
      </div>

      <div className={styles.fields}>
        <TextField label="Libellé" value={label} onChange={setLabel} maxLength={60} />
        <DateField
          label="Date"
          value={date}
          display={date === today ? `Aujourd’hui, ${formatDayMonth(date)}` : formatLongDay(date)}
          onChange={setDate}
        />
        <SelectField<PaymentMethod | 'none'>
          label="Moyen de paiement"
          value={payment}
          onChange={setPayment}
          options={(Object.keys(PAYMENT_LABELS) as (PaymentMethod | 'none')[]).map((value) => ({
            value,
            label: PAYMENT_LABELS[value]
          }))}
        />
      </div>

      <div className={styles.panelButtons}>
        <Button
          label="Supprimer"
          variant="secondary"
          icon="delete"
          onClick={onDelete}
          title="Supprimer (Suppr)"
        />
        <Button label="Enregistrer" disabled={!changed} onClick={save} />
      </div>
    </section>
  )
}
