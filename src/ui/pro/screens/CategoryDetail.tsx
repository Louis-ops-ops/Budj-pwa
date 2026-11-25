import { Navigate } from 'react-router'
import { formatExpenseDate, PAYMENT_LABELS } from '../../../data/format'
import { formatEuro, formatEuroFloor, formatEuroShort } from '../../../data/money'
import { formatMonthName, addMonths } from '../../../data/dates'
import { useCategoryDetail } from '../../../features/useCategoryDetail'
import { Avatar } from '../../../components/Avatar'
import { Button } from '../../../components/Button'
import { CategoryChip, ChipList } from '../../../components/Chip'
import { Icon } from '../../../components/Icon'
import { Text } from '../../../components/Text'
import { TextLink } from '../../../components/TextLink'
import { Row } from '../../shared/List'
import { RoundAction, RoundActions } from '../../shared/RoundAction'
import { ProCard, ProHero } from '../components/ProBlocks'
import { ProPage, ProSection } from '../components/ProPage'
import { DetailTopBar } from '../components/ProTopBar'
import styles from './CategoryDetail.module.css'

/** Figma: UI - Pro › 05 · Dans une catégorie (384:12722). */
export function CategoryDetail(): React.JSX.Element {
  const d = useCategoryDetail()
  if (!d) return <Navigate to="/" replace />
  const { status, stats, actions } = d
  const delta = stats.deltaVsPrevious

  return (
    <ProPage hero="category" paint={d.paint} label={d.category.name}>
      {d.selecting ? (
        <DetailTopBar title={`${d.selected.size} sélectionnée${d.selected.size > 1 ? 's' : ''}`} onBack={actions.exitSelection}>
          <TextLink label="Annuler" onClick={actions.exitSelection} />
        </DetailTopBar>
      ) : (
        <DetailTopBar
          title={d.category.name}
          onBack={actions.back}
          action={{ icon: 'edit', label: 'Modifier la catégorie', onClick: actions.edit }}
        />
      )}

      <ProHero
        label={status.over ? 'Dépassement' : `Restant en ${formatMonthName(d.month)}`}
        cents={status.remaining}
        danger={status.over}
        sub={`${formatEuroFloor(status.spent)} dépensés sur ${formatEuroShort(status.budget)}`}
      />

      {!d.selecting && (
        <RoundActions>
          <RoundAction icon="add" label="Ajouter" onClick={actions.add} />
          <RoundAction icon="budget" label="Budget" onClick={actions.budget} />
          <RoundAction icon="move" label="Déplacer" onClick={actions.startSelection} />
          <RoundAction icon="delete" label="Supprimer" tone="danger" onClick={actions.remove} />
        </RoundActions>
      )}

      <ProSection>
        <ProCard label="Statistiques">
          <div className={styles.stats}>
            <Stat label="Par jour" value={formatEuroFloor(stats.perDay)} />
            <Stat label="Jours restants" value={String(stats.daysLeft)} />
            <Stat
              label={`vs ${formatMonthName(addMonths(d.month, -1))}`}
              value={delta === null ? '—' : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta)} %`}
              tone={delta === null || delta === 0 ? undefined : delta < 0 ? 'success' : 'danger'}
            />
          </div>
        </ProCard>

        <ProCard
          title={`Dépenses de ${formatMonthName(d.month)}`}
          count={String(d.expenses.length)}
          action={!d.selecting && d.expenses.length > 0 ? { label: 'Sélectionner', onClick: actions.startSelection } : undefined}
        >
          {d.expenses.length === 0 && (
            <Text variant="label-regular" color="secondary" as="p" className={styles.empty}>
              Aucune dépense dans cette catégorie ce mois-ci.
            </Text>
          )}
          {d.expenses.map((e) => {
            const checked = d.selected.has(e.id)
            return (
              <Row
                key={e.id}
                selected={d.selecting && checked}
                leading={
                  d.selecting ? (
                    <span className={styles.check} data-checked={checked} aria-hidden="true">
                      {checked && <Icon name="check" size={16} />}
                    </span>
                  ) : (
                    <Avatar color={d.paint} initial={e.label} />
                  )
                }
                title={e.label || 'Dépense'}
                subtitle={[formatExpenseDate(e.date, d.today), e.paymentMethod ? PAYMENT_LABELS[e.paymentMethod] : null]
                  .filter(Boolean)
                  .join(' · ')}
                trailing={`−${formatEuro(e.amount)}`}
                onClick={() => (d.selecting ? actions.toggle(e.id) : actions.openExpense(e.id))}
              />
            )
          })}
        </ProCard>
        {d.selecting && <div className={styles.panelSpace} aria-hidden="true" />}
      </ProSection>

      {d.selecting && (
        <div className={styles.panel} role="region" aria-label="Actions sur la sélection">
          {d.others.length > 0 && (
            <>
              <Text variant="label-medium" color="brand">
                Déplacer vers
              </Text>
              <ChipList label="Déplacer vers">
                {d.others.map((c) => (
                  <CategoryChip
                    key={c.id}
                    label={c.name}
                    color={c.color}
                    selected={d.target === c.id}
                    onClick={() => actions.setTarget(c.id)}
                  />
                ))}
              </ChipList>
            </>
          )}
          <div className={styles.buttons}>
            <Button
              label="Supprimer"
              icon="delete"
              variant="secondary"
              disabled={d.selected.size === 0}
              onClick={actions.deleteSelected}
            />
            <Button
              label="Déplacer"
              icon="move"
              disabled={d.selected.size === 0 || !d.target}
              onClick={actions.move}
            />
          </div>
        </div>
      )}
    </ProPage>
  )
}

function Stat({
  label,
  value,
  tone
}: {
  label: string
  value: string
  tone?: 'success' | 'danger'
}): React.JSX.Element {
  return (
    <div className={styles.stat}>
      <Text variant="label-regular" color="secondary" as="span">
        {label}
      </Text>
      <Text variant="h3" color={tone} as="span" tabular>
        {value}
      </Text>
    </div>
  )
}
