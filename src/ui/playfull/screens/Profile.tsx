import { useProfile } from '../../../features/useProfile'
import { formatMonthName, formatMonthYear } from '../../../data/dates'
import { formatEuroShort, formatNumber } from '../../../data/money'
import { IconButton } from '../../../components/IconButton'
import { Text } from '../../../components/Text'
import { MobilePage } from '../../../layout/Page'
import { ListGroup, MenuRow } from '../../shared/List'
import { ProfileAvatar } from '../../shared/ProfileAvatar'
import styles from './Profile.module.css'

const signed = (cents: number): string => {
  const euros = formatNumber(Math.round(Math.abs(cents) / 100))
  return cents < 0 ? `−${euros}` : `+${euros}`
}

/** Figma: 10 · Profil (418:4623). */
export function Profile(): React.JSX.Element {
  const p = useProfile()

  return (
    <MobilePage>
      <header className={styles.bar}>
        <span className={styles.spacer} aria-hidden="true" />
        <Text variant="h2" as="h1" className={styles.title}>
          Profil
        </Text>
        <IconButton icon="settings" label="Réglages" onClick={p.actions.settings} />
      </header>

      <button type="button" className={styles.identity} onClick={p.actions.editIdentity}>
        <ProfileAvatar initial={p.initial} color={p.avatarColor} />
        <Text variant="h1" as="span">
          {p.firstName}
        </Text>
        <Text variant="label-regular" color="secondary" as="span">
          Sur Budj depuis {p.since}
        </Text>
      </button>

      <section className={styles.goalCard} aria-labelledby="profile-goal">
        <div className={styles.goalHead}>
          <Text variant="h3" color="brand" as="h2" id="profile-goal">
            Objectif d’épargne
          </Text>
          {p.hits.total > 0 && (
            <span className={`t-label-medium ${styles.note}`}>
              Atteint {p.hits.hit} mois sur {p.hits.total}
            </span>
          )}
        </div>
        <p className={styles.total}>
          <span className={`t-display-m tabular ${styles.totalFigure}`}>
            {signed(p.saved)} €
          </span>
          <Text variant="body-medium" color="secondary" as="span">
            depuis {p.sinceMonth}
          </Text>
        </p>
        <Text variant="label-regular" color="secondary">
          {p.goal > 0
            ? `Objectif : ${formatEuroShort(p.goal)} de côté chaque mois`
            : 'Pas encore d’objectif mensuel'}
          {' · '}
          <button type="button" className={styles.link} onClick={p.actions.editGoal}>
            Modifier
          </button>
        </Text>
        {p.history.length > 0 ? (
          <ol
            className={styles.months}
            aria-label={`Objectif ${formatEuroShort(p.goal)} par mois ; atteint ${p.hits.hit} mois sur ${p.hits.total}`}
          >
            {p.history.map((h) => (
              <li
                key={h.month}
                className={styles.month}
                data-state={h.state}
                aria-label={`${formatMonthName(h.month)} : ${signed(h.saved)} €, ${
                  h.state === 'reached'
                    ? 'objectif atteint'
                    : h.state === 'below'
                      ? 'sous l’objectif'
                      : 'objectif manqué'
                }`}
              >
                <span className="t-caption-medium">{h.label}</span>
                <span className="t-label-bold tabular">{signed(h.saved)}</span>
              </li>
            ))}
            {p.upcoming.map((u) => (
              <li key={u.month} className={styles.month} data-state="upcoming" aria-hidden="true">
                <span className="t-caption-medium">{u.label}</span>
                <span className="t-label-bold">–</span>
              </li>
            ))}
          </ol>
        ) : (
          <Text variant="label-regular" color="secondary">
            Ton premier mois se termine bientôt : ton bilan apparaîtra ici.
          </Text>
        )}
      </section>

      {p.summary.best && (
        <section className={styles.section} aria-labelledby="profile-summary">
          <Text variant="h2" as="h2" id="profile-summary">
            Mon bilan
          </Text>
          <div className={styles.tiles}>
            <div className={styles.tile}>
              <Text variant="label-regular" color="secondary" as="span">
                Meilleur mois
              </Text>
              <Text variant="h3" as="span" tabular>
                {formatMonthYear(p.summary.best.month)}
              </Text>
              <Text variant="label-medium" color="success" as="span" tabular>
                {signed(p.summary.best.savings)} €
              </Text>
            </div>
            <div className={styles.tile}>
              <Text variant="label-regular" color="secondary" as="span">
                Dépense moyenne
              </Text>
              <Text variant="h3" as="span" tabular>
                {formatEuroShort(p.summary.averageSpent)}
              </Text>
              <Text variant="label-regular" color="secondary" as="span">
                par mois
              </Text>
            </div>
            <div className={styles.tile}>
              <Text variant="label-regular" color="secondary" as="span">
                Catégorie principale
              </Text>
              <Text variant="h3" as="span">
                {p.summary.topCategory?.category.name ?? '—'}
              </Text>
              {p.summary.topCategory && (
                <Text variant="label-regular" color="secondary" as="span" tabular>
                  {formatEuroShort(p.summary.topCategory.spent)}
                </Text>
              )}
            </div>
            <div className={styles.tile}>
              <Text variant="label-regular" color="secondary" as="span">
                Mois dans le vert
              </Text>
              <Text variant="h3" as="span" tabular>
                {p.summary.green.count} sur {p.summary.green.total}
              </Text>
            </div>
          </div>
        </section>
      )}

      <section className={styles.section} aria-labelledby="profile-budget">
        <Text variant="h2" as="h2" id="profile-budget">
          Mon budget
        </Text>
        <ListGroup>
          <MenuRow
            icon="budget"
            label="Budget mensuel"
            value={p.budget.monthly}
            onClick={p.actions.editBudget}
          />
          <MenuRow
            icon="trendUp"
            label="Objectif d’épargne"
            value={p.budget.goal}
            onClick={p.actions.editGoal}
          />
          <MenuRow
            icon="calendar"
            label="Début du mois"
            value={p.budget.start}
            onClick={p.actions.editStart}
          />
          <MenuRow
            icon="clock"
            label="Report du reste"
            value={p.budget.rollover}
            onClick={p.actions.editRollover}
          />
        </ListGroup>
      </section>
    </MobilePage>
  )
}
