import type { ReactNode } from 'react'
import { Text } from '../components/Text'
import styles from './Page.module.css'

interface PageProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  /** Above the title (breadcrumb). */
  breadcrumb?: ReactNode
  children: ReactNode
}

export function Page({
  title,
  subtitle,
  actions,
  breadcrumb,
  children
}: PageProps): React.JSX.Element {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titles}>
          {breadcrumb}
          <Text variant="h1" as="h1">
            {title}
          </Text>
          {subtitle && (
            <Text variant="body-regular" color="brand-faint">
              {subtitle}
            </Text>
          )}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <div className={styles.body}>{children}</div>
    </main>
  )
}

/** Full-width scrolling screen, for the screens with their own mobile design. */
export function MobilePage({ children }: { children: ReactNode }): React.JSX.Element {
  return <main className={styles.mobilePage}>{children}</main>
}

export function MainColumn({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className={styles.main}>{children}</div>
}

export function AsideColumn({
  children,
  wide
}: {
  children: ReactNode
  wide?: boolean
}): React.JSX.Element {
  return (
    <aside className={[styles.aside, wide ? styles.asideWide : ''].join(' ')}>{children}</aside>
  )
}

export function Card({
  children,
  compact,
  label
}: {
  children: ReactNode
  compact?: boolean
  label?: string
}): React.JSX.Element {
  return (
    <section
      className={[styles.card, compact ? styles.cardCompact : ''].join(' ')}
      aria-label={label}
    >
      {children}
    </section>
  )
}

interface SectionProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function Section({ title, subtitle, actions, children }: SectionProps): React.JSX.Element {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitles}>
          <Text variant="h2" as="h2">
            {title}
          </Text>
          {subtitle && (
            <Text variant="label-regular" color="secondary" tabular>
              {subtitle}
            </Text>
          )}
        </div>
        {actions && <div className={styles.sectionActions}>{actions}</div>}
      </div>
      {children}
    </section>
  )
}
