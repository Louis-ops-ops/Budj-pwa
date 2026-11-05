import type { CSSProperties, ReactNode } from 'react'
import { cssColor } from '../data/colors'
import { useUi, type RowAction } from '../ui/uiStore'
import { useIsMobile } from '../ui/useIsMobile'
import { Icon } from './Icon'
import { Text } from './Text'
import styles from './ExpenseRow.module.css'

interface ExpenseRowProps {
  label: string
  detail?: string
  date?: string
  paymentMethod?: string
  amount: string
  /** CSS color token for the amount (category fg). */
  amountColor: string
  /** CSS color token for the detail line. */
  detailColor?: string
  /** Selected row gets a brand outline (history list). */
  outlined?: boolean
  avatar?: ReactNode
  selected?: boolean
  /** Selection mode: shows a checkbox, the row toggles on click. */
  selectable?: boolean
  onToggle?(): void
  onClick?(): void
  onMove?(): void
  onEdit?(): void
  onDelete?(): void
}

export function ExpenseRow({
  label,
  detail,
  date,
  paymentMethod,
  amount,
  amountColor,
  detailColor,
  outlined,
  avatar,
  selected,
  selectable,
  onToggle,
  onClick,
  onMove,
  onEdit,
  onDelete
}: ExpenseRowProps): React.JSX.Element {
  const isMobile = useIsMobile()
  const openDialog = useUi((s) => s.openDialog)
  const showActions = !selectable && (onMove || onEdit || onDelete)

  // No hover on touch screens: tapping the row opens its actions in a sheet.
  const openActions = (): void => {
    const actions: RowAction[] = []
    if (onMove) actions.push({ label: 'Déplacer', icon: 'move', onSelect: onMove })
    if (onEdit) actions.push({ label: 'Modifier', icon: 'edit', onSelect: onEdit })
    if (onDelete) actions.push({ label: 'Supprimer', icon: 'delete', danger: true, onSelect: onDelete })
    openDialog({ kind: 'actions', title: label, actions })
  }

  const handleClick = selectable ? onToggle : isMobile && showActions ? openActions : onClick

  return (
    <div
      className={[
        styles.row,
        selected ? styles.selected : '',
        outlined ? styles.outlined : '',
        handleClick ? styles.clickable : ''
      ].join(' ')}
      style={
        {
          '--amount-color': cssColor(amountColor),
          ...(detailColor ? { '--detail-color': cssColor(detailColor) } : {})
        } as CSSProperties
      }
      onClick={handleClick}
      role={selectable ? 'checkbox' : undefined}
      aria-checked={selectable ? Boolean(selected) : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={(e) => {
        if (selectable && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault()
          onToggle?.()
        }
      }}
      aria-label={selectable ? `${label}, ${amount}` : undefined}
    >
      {selectable && (
        <span
          className={[styles.check, selected ? styles.checked : ''].join(' ')}
          aria-hidden="true"
        >
          {selected && <span className={styles.tick} />}
        </span>
      )}
      {avatar}
      <span className={styles.texts}>
        <Text variant="body-medium" as="span" className={styles.label}>
          {label}
        </Text>
        {detail && (
          <Text variant="label-regular" as="span" className={styles.detail}>
            {detail}
          </Text>
        )}
      </span>
      {date !== undefined && (
        <Text variant="label-regular" as="span" className={styles.date}>
          {date}
        </Text>
      )}
      {paymentMethod !== undefined && (
        <Text variant="label-regular" as="span" className={styles.payment}>
          {paymentMethod}
        </Text>
      )}
      <Text variant="body-bold" as="span" tabular className={styles.amount}>
        {amount}
      </Text>
      {showActions ? (
        <span className={styles.actions} onClick={(e) => e.stopPropagation()}>
          {onMove && (
            <button
              type="button"
              className={styles.action}
              onClick={onMove}
              aria-label={`Déplacer ${label}`}
              title="Déplacer"
            >
              <Icon name="move" size={16} />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              className={styles.action}
              onClick={onEdit}
              aria-label={`Modifier ${label}`}
              title="Modifier"
            >
              <Icon name="edit" size={16} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={`${styles.action} ${styles.actionDanger}`}
              onClick={onDelete}
              aria-label={`Supprimer ${label}`}
              title="Supprimer"
            >
              <Icon name="delete" size={16} />
            </button>
          )}
        </span>
      ) : (
        !selectable && <span className={styles.actions} aria-hidden="true" />
      )}
    </div>
  )
}
