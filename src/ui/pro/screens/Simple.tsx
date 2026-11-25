// Pro versions of the pushed screens built on grouped lists: Budget,
// Gérer les catégories, Profil, Réglages. Same hooks as Playfull.
import { categoryPaint } from '../../../data/colors'
import { formatMonthName } from '../../../data/dates'
import { formatEuroShort, formatNumber } from '../../../data/money'
import { useBudgetScreen } from '../../../features/useBudgetScreen'
import { useManageCategories } from '../../../features/useManageCategories'
import { useProfile } from '../../../features/useProfile'
import { Avatar } from '../../../components/Avatar'
import { Icon } from '../../../components/Icon'
import { Text } from '../../../components/Text'
import { useNavigate } from 'react-router'
import { AllocationBar } from '../../shared/AllocationBar'
import { ActionRow, MenuRow, Row } from '../../shared/List'
import { ProfileAvatar } from '../../shared/ProfileAvatar'
import { SettingsList } from '../../shared/SettingsList'
import { ProCard, ProHero, ProNote } from '../components/ProBlocks'
import { ProPage, ProSection } from '../components/ProPage'
import { DetailTopBar, RoundButton } from '../components/ProTopBar'
import styles from './Simple.module.css'

const pct = (share: number): string => `${Math.round(share * 100)} %`

/** Figma: UI - Pro › 03 · Budget. */
export function Budget(): React.JSX.Element {
  const b = useBudgetScreen()
  const over = b.breakdown.toAllocate < 0
  return (
    <ProPage hero="home" label="Budget">
      <DetailTopBar
        title="Budget"
        onBack={b.actions.back}
        action={{ icon: 'edit', label: 'Modifier le budget mensuel', onClick: b.actions.editBudget }}
      />
      <ProHero
        label={`Budget de ${b.monthName}`}
        cents={b.breakdown.budget}
        sub={`${b.postCount} poste${b.postCount > 1 ? 's' : ''}`}
      />
      <ProSection>
        <ProCard label="Répartition du budget">
          <div className={styles.padded}>
            <AllocationBar
              segments={b.segments}
              total={b.breakdown.budget}
              label={`${formatEuroShort(b.allocated)} répartis sur ${formatEuroShort(b.breakdown.budget)}`}
            />
            <span className={styles.spread}>
              <Text variant="label-medium" as="span" tabular>
                {formatEuroShort(b.allocated)} répartis
              </Text>
              <Text variant="label-medium" color={over ? 'danger' : 'brand'} as="span" tabular>
                {over
                  ? `${formatEuroShort(-b.breakdown.toAllocate)} au-delà`
                  : `${formatEuroShort(b.breakdown.toAllocate)} à répartir`}
              </Text>
            </span>
          </div>
        </ProCard>
        <ProCard title="Répartition">
          {b.lines.map((l) => (
            <Row
              key={l.key}
              leading={<Avatar color={l.paint} initial={l.initial} />}
              title={l.name}
              subtitle={l.detail}
              trailing={formatEuroShort(l.amount)}
              trailingSub={pct(l.share)}
              onClick={l.onClick}
            />
          ))}
          <ActionRow icon="add" label="Nouvelle catégorie" onClick={b.actions.newCategory} />
        </ProCard>
        <ProCard title="Options">
          <MenuRow icon="trendUp" label="Objectif d’épargne" value={b.options.goal} onClick={b.actions.editGoal} />
          <MenuRow icon="calendar" label="Début du mois" value={b.options.start} onClick={b.actions.editStart} />
          <MenuRow icon="clock" label="Report du reste" value={b.options.rollover} onClick={b.actions.editRollover} />
        </ProCard>
      </ProSection>
    </ProPage>
  )
}

/** Figma: UI - Pro › 02 · Gérer les catégories (426:5038). */
export function ManageCategories(): React.JSX.Element {
  const m = useManageCategories()
  const over = m.breakdown.toAllocate < 0
  return (
    <ProPage hero="none" label="Gérer les catégories">
      <DetailTopBar
        title="Catégories"
        onBack={m.actions.back}
        action={{ icon: 'add', label: 'Nouvelle catégorie', onClick: m.actions.newCategory }}
      />
      <ProSection>
        <ProCard title="Budget réparti" count={`${formatEuroShort(m.allocated)} / ${formatEuroShort(m.breakdown.budget)}`}>
          <div className={styles.padded}>
            <AllocationBar
              total={m.breakdown.budget}
              label="Répartition du budget"
              segments={[
                { key: 'fixed', value: m.breakdown.fixed, color: 'var(--category-bleu-fg)' },
                { key: 'savings', value: m.breakdown.savings, color: 'var(--text-success)' },
                { key: 'categories', value: m.breakdown.categories, color: 'var(--bg-accent)' }
              ]}
            />
            <span className={styles.legend}>
              <Legend color="var(--category-bleu-fg)" label={`Fixes ${formatEuroShort(m.breakdown.fixed)}`} />
              <Legend color="var(--text-success)" label={`Épargne ${formatEuroShort(m.breakdown.savings)}`} />
              <Legend color="var(--bg-accent)" label={`Catégories ${formatEuroShort(m.breakdown.categories)}`} />
            </span>
            <ProNote tone={over ? 'danger' : 'brand'}>
              {over
                ? `${formatEuroShort(-m.breakdown.toAllocate)} au-delà du budget`
                : `${formatEuroShort(m.breakdown.toAllocate)} encore à répartir`}
            </ProNote>
          </div>
        </ProCard>

        <ProCard
          title="Mes catégories"
          count={String(m.categories.length)}
          action={
            m.categories.length > 1
              ? { label: m.reordering ? 'Terminer' : 'Réorganiser', onClick: m.actions.toggleReorder }
              : undefined
          }
        >
          {m.categories.map((c, i) => (
            <div key={c.id} className={styles.editRow}>
              <Row
                leading={<Avatar color={categoryPaint(c)} initial={c.name} />}
                title={c.name}
                subtitle={`${formatEuroShort(c.monthlyBudget)} par mois`}
                onClick={m.reordering ? undefined : () => m.actions.open(c.id)}
              />
              {m.reordering ? (
                <span className={styles.reorder}>
                  <RoundButton icon="chevron" rotate={270} label={`Monter ${c.name}`} onClick={() => i > 0 && m.actions.move(c.id, -1)} />
                  <RoundButton icon="chevron" rotate={90} label={`Descendre ${c.name}`} onClick={() => m.actions.move(c.id, 1)} />
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.delete}
                  aria-label={`Supprimer ${c.name}`}
                  onClick={() => m.actions.remove(c.id)}
                >
                  <Icon name="delete" size={20} />
                </button>
              )}
            </div>
          ))}
          <ActionRow icon="add" label="Nouvelle catégorie" onClick={m.actions.newCategory} />
        </ProCard>

        <ProCard title="Réservé chaque mois">
          <Row
            leading={<Avatar color={{ bg: 'var(--feedback-success-bg)', fg: 'var(--feedback-success-fg)' }} initial="€" />}
            title="Épargne"
            subtitle={m.savings ? 'Réservée dès le 1er' : 'Aucun objectif'}
            trailing={m.savings ? formatEuroShort(m.savings.goal) : '—'}
            onClick={m.actions.editGoal}
          />
          <Row
            leading={<Avatar color="bleu" initial="F" />}
            title="Dépenses fixes"
            subtitle={`${m.fixedGroups.length} sous-catégorie${m.fixedGroups.length > 1 ? 's' : ''}`}
            trailing={formatEuroShort(m.fixedTotal)}
            onClick={m.actions.openFixed}
          />
        </ProCard>
      </ProSection>
    </ProPage>
  )
}

function Legend({ color, label }: { color: string; label: string }): React.JSX.Element {
  return (
    <span className={styles.legendItem}>
      <span className={styles.legendDot} style={{ background: color }} aria-hidden="true" />
      <Text variant="label-regular" color="secondary" as="span" tabular>
        {label}
      </Text>
    </span>
  )
}

const signed = (cents: number): string => {
  const euros = formatNumber(Math.round(Math.abs(cents) / 100))
  return cents < 0 ? `−${euros}` : `+${euros}`
}

/** Figma: UI - Pro › 10 · Profil. Mini chart of the 6 last months with the goal line. */
export function Profile(): React.JSX.Element {
  const p = useProfile()
  const navigate = useNavigate()
  const scale = Math.max(1, p.goal, ...p.history.map((h) => Math.abs(h.saved)))
  const goalRatio = p.goal / scale

  return (
    <ProPage hero="home" label="Profil">
      <DetailTopBar
        title="Profil"
        onBack={() => navigate('/')}
        action={{ icon: 'settings', label: 'Réglages', onClick: p.actions.settings }}
      />
      <button type="button" className={styles.identity} onClick={p.actions.editIdentity}>
        <ProfileAvatar initial={p.initial} color={p.avatarColor} />
        <Text variant="h1" as="span">
          {p.firstName}
        </Text>
        <Text variant="label-regular" as="span" className={styles.deep}>
          Sur Budj depuis {p.since}
        </Text>
      </button>
      <ProSection>
        <ProCard
          title="Objectif d’épargne"
          action={{ label: 'Modifier', onClick: p.actions.editGoal }}
        >
          <div className={styles.padded}>
            <p className={styles.total}>
              <span className={`t-display-m tabular ${styles.totalFigure}`}>{signed(p.saved)} €</span>
              <Text variant="body-medium" color="secondary" as="span">
                depuis {p.sinceMonth}
              </Text>
            </p>
            <Text variant="label-regular" color="secondary">
              {p.goal > 0 ? `Objectif : ${formatEuroShort(p.goal)} de côté chaque mois` : 'Pas encore d’objectif mensuel'}
            </Text>
            {p.history.length > 0 && (
              <>
                <div
                  className={styles.mini}
                  role="img"
                  aria-label={`Objectif ${formatEuroShort(p.goal)} par mois ; atteint ${p.hits.hit} mois sur ${p.hits.total}`}
                >
                  {p.goal > 0 && <span className={styles.goalLine} style={{ bottom: `calc(var(--space-16) + (100% - var(--space-16)) * ${goalRatio})` }} />}
                  {p.history.map((h) => (
                    <span key={h.month} className={styles.miniCol}>
                      <span
                        className={styles.miniBar}
                        data-state={h.state}
                        style={{ height: `${(Math.max(0, h.saved) / scale) * 100}%` }}
                      />
                      <span className="t-caption-medium">{h.label}</span>
                    </span>
                  ))}
                  {p.upcoming.map((u) => (
                    <span key={u.month} className={styles.miniCol} data-upcoming>
                      <span className={styles.miniBar} data-state="upcoming" />
                      <span className="t-caption-medium">{u.label}</span>
                    </span>
                  ))}
                </div>
                <ProNote tone={p.hits.hit > 0 ? 'success' : 'brand'}>
                  Atteint {p.hits.hit} mois sur {p.hits.total}
                </ProNote>
              </>
            )}
          </div>
        </ProCard>

        {p.summary.best && (
          <ProCard title="Mon bilan">
            <Row title="Meilleur mois" trailing={formatMonthName(p.summary.best.month)} trailingSub={`${signed(p.summary.best.savings)} €`} />
            <Row title="Dépense moyenne" trailing={formatEuroShort(p.summary.averageSpent)} trailingSub="par mois" />
            <Row title="Catégorie principale" trailing={p.summary.topCategory?.category.name ?? '—'} />
            <Row title="Mois dans le vert" trailing={`${p.summary.green.count} sur ${p.summary.green.total}`} />
          </ProCard>
        )}

        <ProCard title="Mon budget">
          <MenuRow icon="budget" label="Budget mensuel" value={p.budget.monthly} onClick={p.actions.editBudget} />
          <MenuRow icon="trendUp" label="Objectif d’épargne" value={p.budget.goal} onClick={p.actions.editGoal} />
          <MenuRow icon="calendar" label="Début du mois" value={p.budget.start} onClick={p.actions.editStart} />
          <MenuRow icon="clock" label="Report du reste" value={p.budget.rollover} onClick={p.actions.editRollover} />
        </ProCard>
      </ProSection>
    </ProPage>
  )
}

/** Figma: UI - Pro › 10 · Réglages. */
export function Settings(): React.JSX.Element {
  const navigate = useNavigate()
  return (
    <ProPage hero="none" label="Réglages">
      <DetailTopBar title="Réglages" onBack={() => navigate('/profil')} />
      <ProSection>
        <SettingsList />
      </ProSection>
    </ProPage>
  )
}
