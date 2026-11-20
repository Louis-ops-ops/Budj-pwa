import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import type { Category } from '../shared/types'
import { categoryPaint } from '../data/colors'
import { monthOf, todayISO } from '../data/dates'
import { formatEuroFloor, formatEuroShort, formatNumber } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { useCountUp } from '../ui/motion'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { IconButton } from '../components/IconButton'
import { Text } from '../components/Text'
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
  const shownRemaining = useCountUp(remaining)
  const statuses = sel.categoryStatuses(data, month)
  const groups = sel.fixedGroups(data, month)
  const onTrack = statuses.filter((s) => !s.over)
  const over = statuses.filter((s) => s.over)
  const uncategorized = sel.categorySpent(data, month, null)

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

  /** Figma: Carte catégorie (365:435). Over budget: spent in red, else remaining. */
  const renderCategory = (s: sel.CategoryStatus): React.JSX.Element => {
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
        <span className={styles.cardRow}>
          <Text variant="h2" as="span" className={styles.cardName}>
            {s.category.name}
          </Text>
          {deleting ? (
            <Icon name="delete" size={20} className={styles.deleteIcon} />
          ) : (
            <span className={styles.cardAmount}>
              <Text
                variant="h2"
                as="span"
                tabular
                className={s.over ? styles.dangerText : undefined}
              >
                {formatEuroFloor(s.over ? s.spent : s.remaining)}
              </Text>
              <Text variant="body-regular" as="span" tabular>
                /{formatNumber(Math.floor(s.budget / 100))}
              </Text>
            </span>
          )}
        </span>
      </button>
    )
  }

  return (
    <MobilePage>
      <header className={styles.headerRow}>
        <Text variant="h1" as="h1">
          Mon budget
        </Text>
        <div className={styles.headActions}>
          <Text variant="h1" color="brand-faint" as="span" tabular>
            {formatEuroShort(sel.monthBudget(data, month))}
          </Text>
          <IconButton
            icon="edit"
            label="Modifier le budget"
            onClick={() => openDialog({ kind: 'budget' })}
          />
        </div>
      </header>

      <div className={styles.amountLine}>
        <Text
          variant="display-xl"
          color={remaining < 0 ? 'danger' : 'brand'}
          tabular
          className={`${styles.amount} ${styles.amountBold}`}
        >
          {formatEuroFloor(Math.abs(shownRemaining))}
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
            <Text variant="h1" as="span">
              Dépenses fixes
            </Text>
            <Text variant="h1" as="span" tabular>
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

        {(deleting ? statuses : onTrack).map((s) => renderCategory(s))}

        {!deleting && uncategorized > 0 && (
          <button
            type="button"
            className={styles.card}
            style={
              {
                '--card-bg': 'var(--category-gris-bg)',
                '--card-fg': 'var(--category-gris-fg)'
              } as CSSProperties
            }
            onClick={() => navigate('/historique', { state: { filter: 'none' } })}
          >
            <span className={styles.cardRow}>
              <Text variant="h2" as="span" className={styles.cardName}>
                À catégoriser
              </Text>
              <Text variant="h2" as="span" tabular>
                {formatEuroFloor(uncategorized)}
              </Text>
            </span>
          </button>
        )}

        {statuses.length === 0 && (
          <EmptyState
            title="Aucune catégorie"
            message="Crée des catégories pour répartir ton budget : courses, sorties…"
            actionLabel="Nouvelle catégorie"
            onAction={() => openDialog({ kind: 'newCategory' })}
          />
        )}
      </div>

      {!deleting && over.length > 0 && (
        <section className={styles.list} aria-label="Budget dépassé">
          <Text variant="h2" as="h3" className={styles.primaryText}>
            Budget dépassé
          </Text>
          {over.map((s) => renderCategory(s))}
        </section>
      )}
    </MobilePage>
  )
}
