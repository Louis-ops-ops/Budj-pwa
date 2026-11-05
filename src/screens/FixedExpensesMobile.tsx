import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import type { FixedExpense } from '../shared/types'
import {
  dayNumber,
  formatDayMonth,
  formatMonthName,
  formatRelative,
  makeDay,
  monthOf
} from '../data/dates'
import { initialOf } from '../data/format'
import { formatEuro } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Gauge } from '../components/Gauge'
import { IconButton } from '../components/IconButton'
import { MonthCalendar } from '../components/MonthCalendar'
import { Text } from '../components/Text'
import { UpcomingCharge } from '../components/UpcomingCharge'
import { MobilePage } from '../layout/Page'
import styles from './Mobile.module.css'

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`
const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

function FixedItem({
  fixed,
  caption,
  muted
}: {
  fixed: FixedExpense
  caption: string
  muted?: boolean
}): React.JSX.Element {
  const openDialog = useUi((s) => s.openDialog)
  return (
    <button
      type="button"
      className={styles.fixedItem}
      onClick={() => openDialog({ kind: 'fixed', fixed })}
    >
      <Avatar color="bleu" initial={initialOf(fixed.label)} />
      <span className={styles.fixedTexts}>
        <Text variant="body-medium" as="span">
          {fixed.label}
        </Text>
        <Text variant="caption-medium" color="secondary" as="span">
          {caption}
        </Text>
      </span>
      <Text variant="body-bold" color={muted ? 'tertiary' : 'brand'} as="span" tabular>
        {formatEuro(-fixed.amount)}
      </Text>
    </button>
  )
}

interface CalendarProps {
  month: string
  today: string
  selectedDay: number
  onSelectDay(day: number): void
}

/** Figma: Onglet Fixes, calendrier (9:174). */
export function FixedCalendarMobile({
  month,
  today,
  selectedDay,
  onSelectDay
}: CalendarProps): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const openDialog = useUi((s) => s.openDialog)
  const status = sel.fixedStatus(data, month, today)
  const byDay = sel.fixedByDay(data, month)
  const marked = new Map([...byDay].map(([d, list]) => [d, list.length]))
  const ofDay = byDay.get(selectedDay) ?? []

  return (
    <MobilePage>
      <header className={styles.header}>
        <Text variant="h1" as="h1">
          Mes dépenses fixes
        </Text>
        <div className={styles.spread}>
          <Text variant="body-regular" color="brand-faint" as="span">
            {plural(status.count, 'dépense fixe mensuelle', 'dépenses fixes mensuelles')}
          </Text>
          <Text variant="body-regular" color="brand-faint" as="span" tabular>
            {formatEuro(status.total)}
          </Text>
        </div>
      </header>

      <section className={styles.calendarCard} aria-label="Calendrier">
        <Text variant="h2" as="h2" className={styles.calendarTitle}>
          {formatMonthName(month)}
        </Text>
        <MonthCalendar
          month={month}
          markedDays={marked}
          selectedDay={selectedDay}
          todayDay={month === monthOf(today) ? dayNumber(today) : undefined}
          onSelectDay={onSelectDay}
        />
      </section>

      {ofDay.length > 0 ? (
        <div className={styles.flatList}>
          {ofDay.map((f) => (
            <FixedItem key={f.id} fixed={f} caption="Prélèvement automatique" />
          ))}
        </div>
      ) : (
        <Text variant="label-regular" color="tertiary">
          Aucun prélèvement ce jour-là
        </Text>
      )}

      <div className={styles.floating}>
        <Button
          label="Ajouter"
          icon="add"
          onClick={() => openDialog({ kind: 'fixed', dayOfMonth: selectedDay })}
        />
      </div>
    </MobilePage>
  )
}

/** Figma: Dépenses fixes (235:3367), opened from the card of the home screen. */
export function FixedListMobile({
  month,
  today
}: {
  month: string
  today: string
}): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const openDialog = useUi((s) => s.openDialog)
  const navigate = useNavigate()
  const status = sel.fixedStatus(data, month, today)
  const groups = sel.fixedGroups(data, month)
  const next = sel.upcomingCharges(data, today, 1)[0]

  return (
    <MobilePage>
      <header className={styles.headerRow}>
        <IconButton icon="chevron" iconRotate={180} label="Retour" onClick={() => navigate('/')} />
        <Text variant="h2" as="h1">
          Dépenses fixes
        </Text>
        <IconButton
          icon="add"
          label="Ajouter une dépense fixe"
          onClick={() => openDialog({ kind: 'fixed' })}
        />
      </header>

      <section
        className={styles.hero}
        style={
          {
            '--hero-bg': 'var(--category-bleu-bg)',
            '--hero-fg': 'var(--category-bleu-fg)'
          } as CSSProperties
        }
        aria-label="Total mensuel"
      >
        <div className={styles.spread}>
          <Text variant="label-regular" as="span">
            Chaque mois
          </Text>
          <Text variant="label-regular" as="span">
            {plural(status.count, 'prélèvement', 'prélèvements')}
          </Text>
        </div>
        <Text variant="display-m" tabular className={styles.amount}>
          {formatEuro(status.total)}
        </Text>
        <div className={styles.gaugeRow}>
          <Gauge ratio={status.ratio} fill="bg-accent" track="bg-brand-strong" />
          <Text variant="caption-medium" color="brand" as="span" tabular className={styles.pct}>
            {Math.round(status.ratio * 100)} %
          </Text>
        </div>
        <div className={styles.split}>
          <div className={styles.splitItem}>
            <Text variant="label-regular" as="span">
              Prélevé
            </Text>
            <Text variant="h3" as="span" tabular>
              {formatEuro(status.paid)}
            </Text>
          </div>
          <div className={styles.splitItem}>
            <Text variant="label-regular" as="span">
              À venir
            </Text>
            <Text variant="h3" color="brand" as="span" tabular>
              {formatEuro(status.upcoming)}
            </Text>
          </div>
        </div>
      </section>

      {next && (
        <div className={styles.nextCharge}>
          <Text variant="label-medium" color="brand" as="h2">
            Prochain prélèvement
          </Text>
          <UpcomingCharge
            highlighted
            name={next.fixed.label}
            initial={initialOf(next.fixed.label)}
            amount={formatEuro(-next.fixed.amount)}
            dueLabel={`${capitalize(formatRelative(today, next.date))} · le ${formatDayMonth(next.date)}`}
          />
        </div>
      )}

      {groups.map((g) => (
        <section key={g.subcategory.id} className={styles.group}>
          <div className={styles.spread}>
            <Text variant="h2" as="h2">
              {g.subcategory.name}
            </Text>
            <Text variant="body-regular" color="brand-faint" as="span" tabular>
              {formatEuro(g.total)}
            </Text>
          </div>
          <div className={styles.groupList}>
            {g.items.map((f) => {
              const paid = sel.isFixedPaid(f, month, today)
              const day = sel.chargeDay(f, month)
              return (
                <FixedItem
                  key={f.id}
                  fixed={f}
                  muted={paid}
                  caption={
                    paid
                      ? `Prélevé le ${day}`
                      : `Le ${formatDayMonth(makeDay(month, day))} · à venir`
                  }
                />
              )
            })}
          </div>
        </section>
      ))}

      {groups.length === 0 && (
        <EmptyState
          title="Aucune dépense fixe"
          message="Ajoute ton loyer, tes abonnements et tes factures."
          actionLabel="Ajouter une dépense fixe"
          onAction={() => openDialog({ kind: 'fixed' })}
        />
      )}
    </MobilePage>
  )
}
