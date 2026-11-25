import { useNavigate } from 'react-router'
import { todayISO } from '../data/dates'
import { formatEuroShort } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { useUiStyle } from '../app/StyledScreen'
import { Dialog } from '../components/Dialog'
import { TextLink } from '../components/TextLink'
import { ActionRow, ListGroup, ListSection, MenuRow } from '../ui/shared/List'
import styles from './Dialogs.module.css'

/** Figma: 03 · Depuis Mon budget › Plus (428:5854). */
export function MoreDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const openDialog = useUi((s) => s.openDialog)
  const navigate = useNavigate()
  const style = useUiStyle()
  const month = sel.currentMonth(data, todayISO())
  const toSort = sel.uncategorizedCount(data, month)
  const goal = sel.savingsGoal(data, month)

  // The next sheet opens on top; this one closes underneath.
  const then = (next: () => void) => () => {
    onClose()
    next()
  }

  return (
    <Dialog title="Plus" onClose={onClose}>
      <ListSection title="Créer">
        <ListGroup>
          <ActionRow
            icon="add"
            label="Nouvelle catégorie"
            onClick={then(() => openDialog({ kind: 'newCategory' }))}
          />
          <ActionRow
            icon="calendar"
            label="Nouvelle dépense fixe"
            onClick={then(() => openDialog({ kind: 'fixed' }))}
          />
          <ActionRow
            icon="categories"
            label="Nouvelle sous-catégorie"
            onClick={then(() => openDialog({ kind: 'newSubcategory' }))}
          />
        </ListGroup>
      </ListSection>
      <ListSection title="Gérer">
        <ListGroup>
          <MenuRow
            icon="edit"
            label="Gérer les catégories"
            onClick={then(() => navigate('/categories'))}
          />
          <MenuRow
            icon="history"
            label="Dépenses à catégoriser"
            value={String(toSort)}
            onClick={then(() => openDialog({ kind: 'sortUncategorized' }))}
          />
          <MenuRow
            icon="trendUp"
            label="Objectif d’épargne"
            value={goal > 0 ? formatEuroShort(goal) : 'Aucun'}
            onClick={then(() => openDialog({ kind: 'savingsGoal' }))}
          />
        </ListGroup>
      </ListSection>
      {/* Playfull closes with a link; Pro only has the round cross. */}
      {style === 'playfull' && (
        <div className={styles.centerLink}>
          <TextLink label="Fermer" onClick={onClose} />
        </div>
      )}
    </Dialog>
  )
}
