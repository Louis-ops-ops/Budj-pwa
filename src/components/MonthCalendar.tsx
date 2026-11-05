import { addMonths, daysInMonth, formatLongDay, makeDay, weekdayIndex } from '../data/dates'
import styles from './MonthCalendar.module.css'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export type CalendarDayState = 'default' | 'withExpense' | 'today' | 'selected'

interface CalendarDayProps {
  day: number
  state: CalendarDayState
  /** Number of dots (1–3) under the day. */
  dots?: number
  outside?: boolean
  label?: string
  onClick?(): void
}

export function CalendarDay({
  day,
  state,
  dots = 0,
  outside,
  label,
  onClick
}: CalendarDayProps): React.JSX.Element {
  const classes = [
    styles.day,
    state === 'withExpense' ? styles.withExpense : '',
    state === 'today' ? styles.today : '',
    state === 'selected' ? styles.selected : '',
    outside ? styles.outside : ''
  ].join(' ')
  const content = (
    <>
      <span>{day}</span>
      {dots > 0 && (
        <span className={styles.dots} aria-hidden="true">
          {Array.from({ length: Math.min(dots, 3) }, (_, i) => (
            <span key={i} className={styles.dot} />
          ))}
        </span>
      )}
    </>
  )
  if (!onClick || outside) {
    return (
      <span className={classes} aria-hidden={outside || undefined}>
        {content}
      </span>
    )
  }
  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-label={label}
      aria-pressed={state === 'selected'}
    >
      {content}
    </button>
  )
}

interface MonthCalendarProps {
  /** YYYY-MM */
  month: string
  /** Number of items per day of the month. */
  markedDays: Map<number, number>
  selectedDay: number
  /** Day number of today if it is in this month. */
  todayDay?: number
  onSelectDay(day: number): void
}

/** Monday-first month grid (5 or 6 weeks) of the real month. */
export function MonthCalendar({
  month,
  markedDays,
  selectedDay,
  todayDay,
  onSelectDay
}: MonthCalendarProps): React.JSX.Element {
  const length = daysInMonth(month)
  const lead = weekdayIndex(makeDay(month, 1))
  const prevLength = daysInMonth(addMonths(month, -1))
  const cells: { day: number; outside: boolean }[] = [
    ...Array.from({ length: lead }, (_, i) => ({ day: prevLength - lead + i + 1, outside: true })),
    ...Array.from({ length }, (_, i) => ({ day: i + 1, outside: false }))
  ]
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - lead - length + 1, outside: true })
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))

  return (
    <div className={styles.calendar} role="group" aria-label="Calendrier des prélèvements">
      <div className={`t-label-medium ${styles.row} ${styles.weekday}`} aria-hidden="true">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      {weeks.map((week, w) => (
        <div key={w} className={styles.row}>
          {week.map((cell, i) => {
            const count = cell.outside ? 0 : (markedDays.get(cell.day) ?? 0)
            const state: CalendarDayState =
              !cell.outside && cell.day === selectedDay
                ? 'selected'
                : !cell.outside && cell.day === todayDay
                  ? 'today'
                  : count > 0
                    ? 'withExpense'
                    : 'default'
            return (
              <CalendarDay
                key={i}
                day={cell.day}
                state={state}
                dots={count}
                outside={cell.outside}
                label={`${formatLongDay(makeDay(month, cell.day))}${count ? `, ${count} prélèvement${count > 1 ? 's' : ''}` : ''}`}
                onClick={() => onSelectDay(cell.day)}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
