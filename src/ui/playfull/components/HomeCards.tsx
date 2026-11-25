// Playfull cards of Mon budget (Figma page Composants, section 07 · Cartes).
import type { CSSProperties } from 'react'
import { categoryPaint } from '../../../data/colors'
import { formatEuroFloor, formatNumber } from '../../../data/money'
import type { CategoryStatus, FixedGroup } from '../../../data/selectors'
import type { SavingsCard } from '../../../features/useHome'
import { Text } from '../../../components/Text'
import styles from './HomeCards.module.css'

const paint = (bg: string, fg: string): CSSProperties =>
  ({ '--card-bg': bg, '--card-fg': fg }) as CSSProperties

/** Figma: Carte catégorie (365:435). Normal: remaining /budget. Over: spent in red. */
export function CategoryCard({
  status,
  onClick
}: {
  status: CategoryStatus
  onClick(): void
}): React.JSX.Element {
  const p = categoryPaint(status.category)
  return (
    <button type="button" className={styles.card} style={paint(p.bg, p.fg)} onClick={onClick}>
      <span className={styles.row}>
        <Text variant="h2" as="span" className={styles.name}>
          {status.category.name}
        </Text>
        <span className={styles.amount}>
          <Text
            variant="h2"
            as="span"
            tabular
            className={status.over ? styles.danger : undefined}
          >
            {formatEuroFloor(status.over ? status.spent : status.remaining)}
          </Text>
          <Text variant="body-regular" as="span" tabular>
            /{formatNumber(Math.floor(status.budget / 100))}
          </Text>
        </span>
      </span>
      {status.over && <span className="sr-only">Budget dépassé</span>}
    </button>
  )
}

/** Figma: Carte objectif d'épargne (422:543). En bonne voie / À surveiller. */
export function SavingsGoalCard({
  savings,
  onClick,
  detail
}: {
  savings: SavingsCard
  onClick?(): void
  /** Replaces the default line (e.g. on a past month of Évolution). */
  detail?: string
}): React.JSX.Element {
  const atRisk = savings.status === 'atRisk'
  const tone = atRisk ? 'danger' : 'success'
  const line =
    detail ??
    (atRisk
      ? `${formatEuroFloor(savings.shortfall)} de dépassement · à surveiller`
      : 'Réservés dès le 1er · objectif tenu')
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`${styles.card} ${styles.savings}`}
      style={paint(`var(--feedback-${tone}-bg)`, `var(--feedback-${tone}-fg)`)}
      onClick={onClick}
    >
      <span className={styles.row}>
        <Text variant="h2" as="span" className={styles.name}>
          Épargne
        </Text>
        <span className={styles.amount}>
          <Text variant="h2" as="span" tabular>
            {formatEuroFloor(savings.expected)}
          </Text>
          <Text variant="body-regular" as="span" tabular>
            /{formatNumber(Math.floor(savings.goal / 100))}
          </Text>
        </span>
      </span>
      <Text variant="label-regular" as="span">
        {line}
      </Text>
    </Tag>
  )
}

/** Without a goal, the savings card becomes an invitation (v3 §7.2). */
export function SavingsInvite({ onClick }: { onClick(): void }): React.JSX.Element {
  return (
    <button type="button" className={`${styles.card} ${styles.dashed}`} onClick={onClick}>
      <Text variant="h2" as="span">
        Définir un objectif d’épargne
      </Text>
      <Text variant="label-regular" as="span" color="secondary">
        Il est mis de côté dès le 1er, comme une dépense fixe.
      </Text>
    </button>
  )
}

/** Figma: Carte dépenses fixes (365:579). */
export function FixedCard({
  total,
  groups,
  onClick
}: {
  total: number
  groups: FixedGroup[]
  onClick(): void
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={styles.card}
      style={paint('var(--category-bleu-bg)', 'var(--category-bleu-fg)')}
      onClick={onClick}
    >
      <span className={styles.spread}>
        <Text variant="h1" as="span">
          Dépenses fixes
        </Text>
        <Text variant="h1" as="span" tabular>
          {formatEuroFloor(total)}
        </Text>
      </span>
      {groups.length > 0 && (
        <span className={styles.lines}>
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
  )
}

/** Grey card of the expenses without a category: opens the sorting sheet. */
export function UncategorizedCard({
  total,
  count,
  onClick
}: {
  total: number
  count: number
  onClick(): void
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={styles.card}
      style={paint('var(--category-gris-bg)', 'var(--category-gris-fg)')}
      onClick={onClick}
      aria-label={`À catégoriser : ${count} dépense${count > 1 ? 's' : ''}, ${formatEuroFloor(total)}`}
    >
      <span className={styles.row}>
        <Text variant="h2" as="span" className={styles.name}>
          À catégoriser
        </Text>
        <Text variant="h2" as="span" tabular>
          {formatEuroFloor(total)}
        </Text>
      </span>
    </button>
  )
}

/** Figma 13 · États vides: dashed card when there is no category yet. */
export function NoCategoryCard({ onCreate }: { onCreate(): void }): React.JSX.Element {
  return (
    <div className={`${styles.card} ${styles.dashed} ${styles.centered}`}>
      <Text variant="h2" as="p">
        Pas encore de catégorie
      </Text>
      <Text variant="label-regular" as="p" color="secondary">
        Crée tes postes de dépenses pour répartir ton budget : courses, sorties…
      </Text>
      <button type="button" className={styles.create} onClick={onCreate}>
        <span className="t-label-bold">Créer une catégorie</span>
      </button>
    </div>
  )
}
