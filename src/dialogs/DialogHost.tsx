import { useUi, type DialogEntry } from '../ui/uiStore'
import { ConfirmDialog } from '../components/Dialog'
import { ActionsDialog } from './ActionsDialog'
import { ExpenseDialog } from './ExpenseDialog'
import { EditBudgetDialog } from './EditBudgetDialog'
import { NewCategoryDialog } from './NewCategoryDialog'
import { SettingsDialog } from './SettingsDialog'
import { FixedExpenseDialog } from './FixedExpenseDialog'
import { NewSubcategoryDialog } from './NewSubcategoryDialog'
import { CategoryColorDialog } from './CategoryColorDialog'

/** Renders the stack of open dialogs (a dialog can open another on top). */
export function DialogHost(): React.JSX.Element {
  const dialogs = useUi((s) => s.dialogs)
  const closeDialog = useUi((s) => s.closeDialog)
  return (
    <>
      {dialogs.map((d) => (
        <DialogSwitch key={d.id} entry={d} onClose={() => closeDialog(d.id)} />
      ))}
    </>
  )
}

function DialogSwitch({
  entry,
  onClose
}: {
  entry: DialogEntry
  onClose(): void
}): React.JSX.Element | null {
  switch (entry.kind) {
    case 'expense':
      return (
        <ExpenseDialog categoryId={entry.categoryId} expense={entry.expense} onClose={onClose} />
      )
    case 'budget':
      return <EditBudgetDialog onClose={onClose} />
    case 'categoryBudget':
      return <EditBudgetDialog categoryId={entry.categoryId} onClose={onClose} />
    case 'categoryColor':
      return <CategoryColorDialog categoryId={entry.categoryId} onClose={onClose} />
    case 'newCategory':
      return <NewCategoryDialog onCreated={entry.onCreated} onClose={onClose} />
    case 'fixed':
      return (
        <FixedExpenseDialog fixed={entry.fixed} dayOfMonth={entry.dayOfMonth} onClose={onClose} />
      )
    case 'newSubcategory':
      return <NewSubcategoryDialog onCreated={entry.onCreated} onClose={onClose} />
    case 'confirm':
      return (
        <ConfirmDialog
          title={entry.title}
          message={entry.message}
          confirmLabel={entry.confirmLabel}
          onConfirm={entry.onConfirm}
          onClose={onClose}
        />
      )
    case 'settings':
      return <SettingsDialog onClose={onClose} />
    case 'actions':
      return <ActionsDialog title={entry.title} actions={entry.actions} onClose={onClose} />
    default:
      return null
  }
}
