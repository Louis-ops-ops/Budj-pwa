import { useUi, type DialogEntry } from '../ui/uiStore'
import { ConfirmDialog, DialogClosing } from '../components/Dialog'
import { ActionsDialog } from './ActionsDialog'
import { ExpenseDialog } from './ExpenseDialog'
import { EditBudgetDialog } from './EditBudgetDialog'
import { NewCategoryDialog } from './NewCategoryDialog'
import { SettingsDialog } from './SettingsDialog'
import { FixedExpenseDialog } from './FixedExpenseDialog'
import { NewSubcategoryDialog } from './NewSubcategoryDialog'
import { CategoryColorDialog } from './CategoryColorDialog'
import { MoreDialog } from './MoreDialog'
import {
  ChoiceDialog,
  ExportDialog,
  ImportPreviewDialog,
  ReminderTimeDialog,
  ResetDialog
} from './SettingsDialogs'
import { IdentityDialog } from './IdentityDialog'
import { DeleteCategoryDialog } from './DeleteCategoryDialog'
import { MonthStartDialog, RolloverDialog } from './BudgetOptionDialogs'
import { SavingsGoalDialog } from './SavingsGoalDialog'
import { SortUncategorizedDialog } from './SortUncategorizedDialog'

/** Renders the stack of open dialogs (a dialog can open another on top). */
export function DialogHost(): React.JSX.Element {
  const dialogs = useUi((s) => s.dialogs)
  const closeDialog = useUi((s) => s.closeDialog)
  return (
    <>
      {dialogs.map((d) => (
        <DialogClosing.Provider key={d.id} value={Boolean(d.closing)}>
          <DialogSwitch entry={d} onClose={() => closeDialog(d.id)} />
        </DialogClosing.Provider>
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
    case 'more':
      return <MoreDialog onClose={onClose} />
    case 'savingsGoal':
      return <SavingsGoalDialog onClose={onClose} />
    case 'sortUncategorized':
      return <SortUncategorizedDialog onClose={onClose} />
    case 'monthStart':
      return <MonthStartDialog onClose={onClose} />
    case 'rollover':
      return <RolloverDialog onClose={onClose} />
    case 'deleteCategory':
      return (
        <DeleteCategoryDialog
          categoryId={entry.categoryId}
          onDeleted={entry.onDeleted}
          onClose={onClose}
        />
      )
    case 'identity':
      return <IdentityDialog onClose={onClose} />
    case 'choice':
      return (
        <ChoiceDialog
          title={entry.title}
          options={entry.options}
          value={entry.value}
          onSelect={entry.onSelect}
          note={entry.note}
          onClose={onClose}
        />
      )
    case 'export':
      return <ExportDialog onClose={onClose} />
    case 'importPreview':
      return <ImportPreviewDialog data={entry.data} onClose={onClose} />
    case 'reset':
      return <ResetDialog onClose={onClose} />
    case 'reminderTime':
      return <ReminderTimeDialog onClose={onClose} />
    case 'actions':
      return <ActionsDialog title={entry.title} actions={entry.actions} onClose={onClose} />
    default:
      return null
  }
}
