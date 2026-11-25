// Date helpers on plain strings: YYYY-MM-DD for days, YYYY-MM for months.
// Date objects are only used transiently (in UTC) for arithmetic and formatting.

const pad = (n: number): string => String(n).padStart(2, '0')

export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const monthOf = (day: string): string => day.slice(0, 7)
export const dayNumber = (day: string): number => Number(day.slice(8, 10))

export function makeDay(month: string, day: number): string {
  return `${month}-${pad(day)}`
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const index = y * 12 + (m - 1) + n
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** Months from `from` to `to` inclusive. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = []
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m)
  return out
}

/**
 * Budget month a day belongs to when the month starts on `startDay` (1–28).
 * With 5: from the 5th to the 4th of the next month, named after the first one.
 */
export function budgetMonthOf(day: string, startDay = 1): string {
  return dayNumber(day) >= startDay ? monthOf(day) : addMonths(monthOf(day), -1)
}

/** First and last day of a budget month. */
export function periodBounds(month: string, startDay = 1): { first: string; last: string } {
  const first = makeDay(month, startDay)
  if (startDay === 1) return { first, last: makeDay(month, daysInMonth(month)) }
  return { first, last: makeDay(addMonths(month, 1), startDay - 1) }
}

/**
 * Date a fixed expense charged on `dayOfMonth` falls on within a budget month.
 * Days before the start day belong to the next calendar month; 31 → last day of shorter months.
 */
export function chargeDateIn(month: string, dayOfMonth: number, startDay = 1): string {
  const calendar = dayOfMonth >= startDay ? month : addMonths(month, 1)
  return makeDay(calendar, Math.min(dayOfMonth, daysInMonth(calendar)))
}

/** Adds n days to a day. */
export function addDays(day: string, n: number): string {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10) + n))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Day difference b − a. */
export function daysBetween(a: string, b: string): number {
  const toUtc = (d: string): number => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000)
}

/** Monday-based weekday index (0 = Monday … 6 = Sunday). */
export function weekdayIndex(day: string): number {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)))
  return (d.getUTCDay() + 6) % 7
}

const utc = (day: string): Date =>
  new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)))

const fmt = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...options })

const longDay = fmt({ weekday: 'long', day: 'numeric', month: 'long' })
const shortWeekday = fmt({ weekday: 'short' })
const shortMonth = fmt({ month: 'short' })
const dayMonth = fmt({ day: 'numeric', month: 'long' })
const monthYear = fmt({ month: 'long', year: 'numeric' })
const monthName = fmt({ month: 'long' })
const monthShort = fmt({ month: 'short' })

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
const ordinal = (n: number): string => (n === 1 ? '1er' : String(n))

/** "Lundi 26 octobre" */
export function formatLongDay(day: string): string {
  return capitalize(longDay.format(utc(day)))
}

/** "Mer. 28 oct." / "Dim. 1er nov." */
export function formatShortDay(day: string): string {
  const d = utc(day)
  const weekday = capitalize(shortWeekday.format(d))
  return `${weekday} ${ordinal(dayNumber(day))} ${shortMonth.format(d)}`
}

/** "26 octobre" / "1er novembre" */
export function formatDayMonth(day: string): string {
  const d = utc(day)
  return `${ordinal(dayNumber(day))} ${dayMonth.format(d).split(' ').slice(1).join(' ')}`
}

/** "Octobre 2026" */
export function formatMonthYear(month: string): string {
  return capitalize(monthYear.format(utc(`${month}-01`)))
}

/** "octobre" */
export function formatMonthName(month: string): string {
  return monthName.format(utc(`${month}-01`))
}

/** "Oct." */
export function formatMonthShort(month: string): string {
  return capitalize(monthShort.format(utc(`${month}-01`)))
}

/** "aujourd'hui" / "demain" / "dans 3 jours" */
export function formatRelative(today: string, day: string): string {
  const n = daysBetween(today, day)
  if (n === 0) return "aujourd'hui"
  if (n === 1) return 'demain'
  return `dans ${n} jours`
}
