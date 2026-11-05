import { useState } from 'react'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import * as sel from '../data/selectors'
import { formatEuro } from '../data/money'
import { initialOf } from '../data/format'
import {
  dayNumber,
  formatLongDay,
  formatMonthYear,
  formatRelative,
  makeDay,
  monthOf,
  todayISO,
  daysBetween
} from '../data/dates'
import { AsideColumn, Card, MainColumn, Page, Section } from '../layout/Page'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { FixedRow } from '../components/FixedRow'
import { Gauge } from '../components/Gauge'
import { MonthCalendar } from '../components/MonthCalendar'
import { MonthPicker } from '../components/MonthPicker'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { UpcomingCharge } from '../components/UpcomingCharge'
import { useIsMobile } from '../ui/useIsMobile'
import { FixedCalendarMobile, FixedListMobile } from './FixedExpensesMobile'
import styles from './FixedExpenses.module.css'

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`
const dayLabel = (d: number): string => `Le ${d === 1 ? '1er' : d}`

export function FixedExpenses({ list }: { list?: boolean }): React.JSX.Element {
  const isMobile = useIsMobile()
  const data = useBudj((s) => s.data)
  const month = useUi((s) => s.month)
  const setMonth = useUi((s) => s.setMonth)
  // Selected day per month; defaults to the next charge day.
  const [picked, setPicked] = useState<{ month: string; day: number } | null>(null)
  const today = todayISO()
  const isCurrent = month === monthOf(today)
  const selectedDay =
    picked?.month === month ? picked.day : sel.defaultCalendarDay(data, month, today)

  if (isMobile) {
    return list ? (
      <FixedListMobile month={month} today={today} />
    ) : (
      <FixedCalendarMobile
        month={month}
        today={today}
        selectedDay={selectedDay}
        onSelectDay={(day) => setPicked({ month, day })}
      />
    )
  }

  return (
    <FixedExpensesContent
      month={month}
      today={today}
      isCurrent={isCurrent}
      selectedDay={selectedDay}
      onSelectDay={(day) => setPicked({ month, day })}
      onMonth={setMonth}
      dataMonths={sel.availableMonths(data, today)}
    />
  )
}

interface ContentProps {
  month: string
  today: string
  isCurrent: boolean
  selectedDay: number
  dataMonths: string[]
  onSelectDay(day: number): void
  onMonth(month: string): void
}

function FixedExpensesContent({
  month,
  today,
  isCurrent,
  selectedDay,
  dataMonths,
  onSelectDay,
  onMonth
}: ContentProps): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const openDialog = useUi((s) => s.openDialog)

  const status = sel.fixedStatus(data, month, today)
  const groups = sel.fixedGroups(data, month)
  const byDay = sel.fixedByDay(data, month)
  const marked = new Map([...byDay].map(([d, list]) => [d, list.length]))
  const selectedDate = makeDay(month, selectedDay)
  const ofDay = byDay.get(selectedDay) ?? []
  const subName = (id: string): string =>
    data.fixedSubcategories.find((s) => s.id === id)?.name ?? 'Autres'
  const paidCount = sel.paidFixed(data, month, today).length

  const relative = (): string => {
    const diff = daysBetween(today, selectedDate)
    if (diff >= 0) return formatRelative(today, selectedDate)
    return diff === -1 ? 'hier' : `il y a ${-diff} jours`
  }

  return (
    <Page
      title="Dépenses fixes"
      subtitle="Prélevées automatiquement chaque mois"
      actions={
        <>
          <MonthPicker value={month} months={dataMonths} onChange={onMonth} />
          <Button
            label="Ajouter une dépense fixe"
            variant="secondary"
            icon="add"
            onClick={() => openDialog({ kind: 'fixed' })}
          />
        </>
      }
    >
      <MainColumn>
        <Card label="Total mensuel">
          <Text variant="body-medium" color="brand-faint">
            Chaque mois
          </Text>
          <div className={styles.amountLine}>
            <Text variant="display-l" color="brand" tabular>
              {formatEuro(status.total)}
            </Text>
            <Text variant="h3" color="brand-faint" tabular>
              soit {formatEuro(status.total * 12)} par an
            </Text>
          </div>
          <Gauge ratio={status.ratio} fill="bg-accent" track="bg-brand-muted" height="strong" />
          <div className={styles.legend}>
            <Legend color="bg-accent" label="Déjà prélevé" value={status.paid} />
            <Legend color="bg-brand-muted" label="À venir" value={status.upcoming} />
            <Text variant="label-regular" as="span" className={styles.counter}>
              {paidCount} {paidCount > 1 ? 'prélèvements' : 'prélèvement'} sur {status.count}
            </Text>
          </div>
        </Card>

        <Section
          title="Tous les prélèvements"
          subtitle="Regroupés par sous-catégorie"
          actions={
            <TextLink
              label="Nouvelle sous-catégorie"
              icon="add"
              onClick={() => openDialog({ kind: 'newSubcategory' })}
            />
          }
        >
          {groups.length === 0 ? (
            <EmptyState
              title="Aucune dépense fixe"
              message="Ajoute ton loyer, tes abonnements et tes factures : ils seront comptés dès le 1er du mois."
              actionLabel="Ajouter une dépense fixe"
              onAction={() => openDialog({ kind: 'fixed' })}
            />
          ) : (
            <div className={styles.table}>
              <div className={`t-label-medium ${styles.head}`} aria-hidden="true">
                <span className={styles.headLogo} />
                <span className={styles.headName}>Prélèvement</span>
                <span className={styles.headDay}>Jour</span>
                <span className={styles.headStatus}>Statut</span>
                <span className={styles.headMonthly}>Par mois</span>
                <span className={styles.headYearly}>Par an</span>
                <span className={styles.headAction} />
              </div>
              {groups.map((g) => (
                <div key={g.subcategory.id} role="group" aria-label={g.subcategory.name}>
                  <div className={styles.group}>
                    <Text variant="body-bold" as="span">
                      {g.subcategory.name}
                    </Text>
                    <Text variant="label-regular" color="brand-faint" as="span" tabular>
                      {formatEuro(g.total)} / mois
                    </Text>
                  </div>
                  {g.items.map((f) => (
                    <FixedRow
                      key={f.id}
                      status={sel.isFixedPaid(f, month, today) ? 'paid' : 'upcoming'}
                      name={f.label}
                      initial={initialOf(f.label)}
                      day={dayLabel(sel.chargeDay(f, month))}
                      monthly={formatEuro(f.amount)}
                      yearly={formatEuro(sel.annualCost(f))}
                      onEdit={
                        f.endMonth !== undefined && f.endMonth < monthOf(today)
                          ? undefined
                          : () => openDialog({ kind: 'fixed', fixed: f })
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </Section>
      </MainColumn>

      <AsideColumn>
        <Card compact label="Calendrier">
          <div className={styles.calendarHead}>
            <Text variant="h3" as="h2">
              {formatMonthYear(month)}
            </Text>
            <Text variant="label-regular" color="brand-faint" as="span">
              {plural(status.count, 'prélèvement', 'prélèvements')}
            </Text>
          </div>
          <MonthCalendar
            month={month}
            markedDays={marked}
            selectedDay={selectedDay}
            todayDay={isCurrent ? dayNumber(today) : undefined}
            onSelectDay={onSelectDay}
          />
        </Card>

        <Card compact label="Jour sélectionné">
          <div className={styles.dayTitle}>
            <Text variant="h3" as="h2">
              {formatLongDay(selectedDate)}
            </Text>
            <Text variant="label-regular" color="secondary">
              {ofDay.length > 0
                ? `${plural(ofDay.length, 'prélèvement', 'prélèvements')} · ${relative()}`
                : 'Aucun prélèvement ce jour-là'}
            </Text>
          </div>
          <div className={styles.dayList}>
            {ofDay.map((f) => (
              <UpcomingCharge
                key={f.id}
                highlighted={!sel.isFixedPaid(f, month, today)}
                name={f.label}
                initial={initialOf(f.label)}
                amount={formatEuro(-f.amount)}
                dueLabel={subName(f.subcategoryId)}
              />
            ))}
          </div>
          {ofDay.length === 0 && (
            <TextLink
              label="Ajouter un prélèvement ce jour-là"
              icon="add"
              onClick={() => openDialog({ kind: 'fixed', dayOfMonth: selectedDay })}
            />
          )}
        </Card>
      </AsideColumn>
    </Page>
  )
}

function Legend({
  color,
  label,
  value
}: {
  color: string
  label: string
  value: number
}): React.JSX.Element {
  return (
    <span className={styles.legendItem}>
      <span
        className={styles.legendDot}
        style={{ background: `var(--${color})` }}
        aria-hidden="true"
      />
      <Text variant="label-regular" color="tertiary" as="span">
        {label}
      </Text>
      <Text variant="label-bold" color="primary" as="span" tabular>
        {formatEuro(value)}
      </Text>
    </span>
  )
}
