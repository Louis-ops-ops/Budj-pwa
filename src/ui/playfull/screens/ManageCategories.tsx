import type { CSSProperties } from 'react'
import { useManageCategories } from '../../../features/useManageCategories'
import { categoryPaint } from '../../../data/colors'
import { formatEuroShort } from '../../../data/money'
import { Button } from '../../../components/Button'
import { Icon } from '../../../components/Icon'
import { IconButton } from '../../../components/IconButton'
import { Text } from '../../../components/Text'
import { TextLink } from '../../../components/TextLink'
import { MobilePage } from '../../../layout/Page'
import { AllocationBar } from '../../shared/AllocationBar'
import { FixedCard, SavingsGoalCard, SavingsInvite } from '../components/HomeCards'
import { PushedHeader } from '../components/PushedHeader'
import styles from './ManageCategories.module.css'

/**
 * Figma: 02 · Gérer les catégories (428:5919). Replaces the old delete mode of
 * Mon budget (v3 §7.11).
 */
export function ManageCategories(): React.JSX.Element {
  const m = useManageCategories()
  const over = m.breakdown.toAllocate < 0

  return (
    <MobilePage>
      <PushedHeader
        title="Catégories"
        onBack={m.actions.back}
        action={{ icon: 'add', label: 'Nouvelle catégorie', onClick: m.actions.newCategory }}
      />

      <div className={styles.allocation}>
        <span className={styles.spread}>
          <Text variant="body-medium" as="span">
            Budget réparti
          </Text>
          <Text variant="body-regular" color="secondary" as="span" tabular>
            {formatEuroShort(m.allocated)} / {formatEuroShort(m.breakdown.budget)}
          </Text>
        </span>
        <AllocationBar
          total={m.breakdown.budget}
          label={`Fixes ${formatEuroShort(m.breakdown.fixed)}, épargne ${formatEuroShort(m.breakdown.savings)}, catégories ${formatEuroShort(m.breakdown.categories)}`}
          segments={[
            { key: 'fixed', value: m.breakdown.fixed, color: 'var(--category-bleu-fg)' },
            { key: 'savings', value: m.breakdown.savings, color: 'var(--text-success)' },
            { key: 'categories', value: m.breakdown.categories, color: 'var(--bg-accent)' }
          ]}
        />
        <Text variant="label-regular" color={over ? 'danger' : 'secondary'} tabular>
          {over
            ? `${formatEuroShort(-m.breakdown.toAllocate)} au-delà du budget`
            : `${formatEuroShort(m.breakdown.toAllocate)} encore à répartir`}
        </Text>
      </div>

      <section className={styles.section} aria-labelledby="manage-list">
        <div className={styles.spread}>
          <Text variant="h2" as="h2" id="manage-list">
            Mes catégories
          </Text>
          {m.categories.length > 1 && (
            <TextLink
              label={m.reordering ? 'Terminer' : 'Réorganiser'}
              onClick={m.actions.toggleReorder}
            />
          )}
        </div>
        {m.categories.map((c, i) => {
          const paint = categoryPaint(c)
          return (
            <div
              key={c.id}
              className={styles.card}
              style={{ '--card-bg': paint.bg, '--card-fg': paint.fg } as CSSProperties}
            >
              <button
                type="button"
                className={styles.name}
                onClick={() => m.actions.open(c.id)}
                disabled={m.reordering}
              >
                <Text variant="h2" as="span">
                  {c.name}
                </Text>
              </button>
              {m.reordering ? (
                <span className={styles.reorder}>
                  <IconButton
                    icon="chevron"
                    iconRotate={270}
                    label={`Monter ${c.name}`}
                    disabled={i === 0}
                    onClick={() => m.actions.move(c.id, -1)}
                  />
                  <IconButton
                    icon="chevron"
                    iconRotate={90}
                    label={`Descendre ${c.name}`}
                    disabled={i === m.categories.length - 1}
                    onClick={() => m.actions.move(c.id, 1)}
                  />
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.delete}
                  aria-label={`Supprimer ${c.name}`}
                  onClick={() => m.actions.remove(c.id)}
                >
                  <Icon name="delete" size={24} />
                </button>
              )}
            </div>
          )
        })}
        <Button
          label="Nouvelle catégorie"
          icon="add"
          variant="secondary"
          onClick={m.actions.newCategory}
          className={styles.full}
        />
      </section>

      <section className={styles.section} aria-labelledby="manage-reserved">
        <Text variant="h2" as="h2" id="manage-reserved">
          Réservé chaque mois
        </Text>
        {m.savings ? (
          <SavingsGoalCard savings={m.savings} onClick={m.actions.editGoal} />
        ) : (
          <SavingsInvite onClick={m.actions.editGoal} />
        )}
        <FixedCard total={m.fixedTotal} groups={m.fixedGroups} onClick={m.actions.openFixed} />
      </section>
    </MobilePage>
  )
}
