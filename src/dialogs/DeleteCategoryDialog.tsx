import { todayISO, formatMonthName } from '../data/dates'
import { formatEuroShort } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { useIsMobile } from '../ui/useIsMobile'
import { Dialog } from '../components/Dialog'
import { Text } from '../components/Text'
import { Avatar } from '../components/Avatar'
import { categoryPaint } from '../data/colors'
import { Row } from '../ui/shared/List'
import styles from './Dialogs.module.css'
import { CategoryCard } from '../ui/playfull/components/HomeCards'

/** Figma: 12 · Supprimer une catégorie (428:6049). */
export function DeleteCategoryDialog({
  categoryId,
  onClose,
  onDeleted
}: {
  categoryId: string
  onClose(): void
  onDeleted?(): void
}): React.JSX.Element | null {
  const isMobile = useIsMobile()
  const data = useBudj((s) => s.data)
  const deleteCategory = useBudj((s) => s.deleteCategory)
  const toast = useUi((s) => s.toast)
  const category = data.categories.find((c) => c.id === categoryId)
  if (!category) return null

  const month = sel.currentMonth(data, todayISO())
  const count = sel.categoryExpenses(data, month, category.id).length
  const status = sel.categoryStatus(data, month, category)
  const expenses =
    count === 0
      ? `Elle n’a aucune dépense en ${formatMonthName(month)}`
      : count === 1
        ? `Sa dépense de ${formatMonthName(month)} passera dans « Sans catégorie »`
        : `Ses ${count} dépenses de ${formatMonthName(month)} passeront dans « Sans catégorie »`

  return (
    <Dialog
      title={`Supprimer ${category.name} ?`}
      onClose={onClose}
      onSubmit={() => {
        deleteCategory(category.id)
        toast(`Catégorie « ${category.name} » supprimée`)
        onClose()
        onDeleted?.()
      }}
      submitLabel="Supprimer la catégorie"
      submitVariant="danger"
      cancelVisible
    >
      {isMobile ? (
        <div className={styles.previewCard}>
          <Row
            leading={<Avatar color={categoryPaint(category)} initial={category.name} />}
            title={category.name}
            subtitle={`${count} dépense${count > 1 ? 's' : ''} en ${formatMonthName(month)}`}
            trailing={formatEuroShort(status.spent)}
            trailingSub={`sur ${formatEuroShort(category.monthlyBudget)}`}
          />
        </div>
      ) : (
        <CategoryCard status={status} onClick={() => undefined} />
      )}
      <Text variant="body-regular" color="secondary">
        {expenses} et ses {formatEuroShort(category.monthlyBudget)} seront libérés. Cette action
        est définitive.
      </Text>
    </Dialog>
  )
}
