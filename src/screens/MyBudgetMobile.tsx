import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import type { Category } from '../shared/types'
import { categoryPaint } from '../data/colors'
import { monthOf, todayISO } from '../data/dates'
import { formatEuroFloor, formatEuroShort } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { IconButton } from '../components/IconButton'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { MobilePage } from '../layout/Page'
import styles from './Mobile.module.css'

/** Figma: Accueil — Mon budget (181:1312) and its delete mode (30:763). */
export function MyBudgetMobile(): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const deleteCategory = useBudj((s) => s.deleteCategory)
  const openDialog = useUi((s) => s.openDialog)
  const toast = useUi((s) => s.toast)
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  const today = todayISO()
  const month = monthOf(today)
  const remaining = sel.globalRemaining(data, month)
  const statuses = sel.categoryStatuses(data, month)
  const groups = sel.fixedGroups(data, month)

  const confirmDelete = (category: Category): void => {
    const count = data.expenses.filter((e) => e.categoryId === category.id).length
    openDialog({
      kind: 'confirm',
      title: `Supprimer ${category.name} ?`,
      message:
        count > 0
          ? `${count > 1 ? `Ses ${count} dépenses passeront` : 'Sa dépense passera'} dans « À catégoriser ».`
          : 'Cette catégorie n’a aucune dépense.',
      confirmLabel: 'Supprimer la catégorie',
      onConfirm: () => {
        deleteCategory(category.id)
        toast(`Catégorie « ${category.name} » supprimée`)
      }
    })
  }

  return (
    <MobilePage>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <Text variant="h1" as="h1">
            Mon budget
          </Text>
          <IconButton
            icon="edit"
            label="Modifier le budget"
            onClick={() => openDialog({ kind: 'budget' })}
          />
        </div>
        <div className={styles.spread}>
          <Text variant="body-regular" color="brand-faint" as="span">
            Budget défini de
          </Text>
          <Text variant="body-regular" color="brand-faint" as="span" tabular>
            {formatEuroShort(sel.monthBudget(data, month))}
          </Text>
        </div>
      </header>

      <div className={styles.amountLine}>
        <Text
          variant="display-l"
          color={remaining < 0 ? 'danger' : 'brand'}
          tabular
          className={styles.amount}
        >
          {formatEuroFloor(Math.abs(remaining))}
        </Text>
        {remaining < 0 && (
          <Text variant="h3" color="danger">
            de dépassement
          </Text>
        )}
      </div>

      <div className={styles.sectionHead}>
        <Text variant="h1" as="h2">
          Mes catégories
        </Text>
        <div className={styles.headActions}>
          <IconButton
            icon="add"
            label="Nouvelle catégorie"
            onClick={() => openDialog({ kind: 'newCategory' })}
          />
          <IconButton
            icon="delete"
            label={deleting ? 'Quitter la suppression' : 'Supprimer des catégories'}
            aria-pressed={deleting}
            tone={deleting ? 'danger' : 'brand'}
            onClick={() => setDeleting(!deleting)}
          />
        </div>
      </div>

      <div className={styles.list}>
        <button
          type="button"
          className={styles.card}
          style={
            {
              '--card-bg': 'var(--category-bleu-bg)',
              '--card-fg': 'var(--category-bleu-fg)'
            } as CSSProperties
          }
          onClick={() => navigate('/fixes/liste')}
        >
          <span className={styles.spread}>
            <Text variant="h2" as="span">
              Dépenses fixes
            </Text>
            <Text variant="body-medium" as="span" tabular>
              {formatEuroFloor(sel.fixedTotal(data, month))}
            </Text>
          </span>
          {groups.length > 0 && (
            <span className={styles.fixedLines}>
              {groups.map((g) => (
                <span key={g.subcategory.id} className={styles.spread}>
                  <Text variant="label-regular" as="span">
                    {g.subcategory.name}
                  </Text>
                  <Text variant="label-regular" as="span" tabular>
                    {formatEuroFloor(g.total)}
                  </Text>
                </span>
              ))}
            </span>
          )}
        </button>

        {statuses.map((s) => {
          const paint = categoryPaint(s.category)
          return (
            <button
              key={s.category.id}
              type="button"
              className={styles.card}
              style={{ '--card-bg': paint.bg, '--card-fg': paint.fg } as CSSProperties}
              aria-label={deleting ? `Supprimer ${s.category.name}` : undefined}
              onClick={() =>
                deleting ? confirmDelete(s.category) : navigate(`/categories/${s.category.id}`)
              }
            >
              {deleting ? (
                <span className={styles.cardRow}>
                  <Text variant="h3" as="span" className={styles.cardName}>
                    {s.category.name}
                  </Text>
                  <Icon name="delete" size={20} className={styles.deleteIcon} />
                </span>
              ) : (
                <span className={styles.cardBody}>
                  <span className={styles.spread}>
                    <Text variant="h3" as="span">
                      {s.category.name}
                    </Text>
                    <Text
                      variant="h3"
                      as="span"
                      tabular
                      className={s.over ? styles.dangerText : undefined}
                    >
                      {formatEuroFloor(Math.abs(s.remaining))}
                    </Text>
                  </span>
                  <span className={styles.spread}>
                    <Text variant="label-regular" as="span" className={styles.primaryText}>
                      {s.over ? 'Dépassé, budget alloué' : 'Budget alloué'}
                    </Text>
                    <Text variant="label-regular" as="span" tabular className={styles.primaryText}>
                      {formatEuroShort(s.budget)}
                    </Text>
                  </span>
                </span>
              )}
            </button>
          )
        })}

        {statuses.length === 0 && (
          <EmptyState
            title="Aucune catégorie"
            message="Crée des catégories pour répartir ton budget : courses, sorties…"
            actionLabel="Nouvelle catégorie"
            onAction={() => openDialog({ kind: 'newCategory' })}
          />
        )}
      </div>

      <TextLink
        label="Réglages"
        className={styles.settings}
        onClick={() => openDialog({ kind: 'settings' })}
      />
    </MobilePage>
  )
}
