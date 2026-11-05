import { NavLink } from 'react-router'
import { Button } from './Button'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'
import styles from './Sidebar.module.css'

interface NavItemProps {
  to: string
  icon: IconName
  label: string
  shortcut: string
  end?: boolean
  /** Extra paths that also mark this item as active. */
  activeFor?: (pathname: string) => boolean
  pathname: string
}

export function NavItem({
  to,
  icon,
  label,
  shortcut,
  end,
  activeFor,
  pathname
}: NavItemProps): React.JSX.Element {
  return (
    <NavLink
      to={to}
      end={end}
      title={`${label} (${shortcut})`}
      className={({ isActive }) =>
        [styles.item, isActive || activeFor?.(pathname) ? styles.active : ''].join(' ')
      }
      aria-current={activeFor?.(pathname) ? 'page' : undefined}
    >
      <Icon name={icon} size={20} className={styles.icon} />
      {label}
    </NavLink>
  )
}

interface SidebarProps {
  pathname: string
  onNewExpense(): void
  onOpenSettings(): void
}

export function Sidebar({
  pathname,
  onNewExpense,
  onOpenSettings
}: SidebarProps): React.JSX.Element {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Text variant="h1" as="span">
          Budj
        </Text>
      </div>
      <Button
        label="Nouvelle dépense"
        icon="add"
        fullWidth
        onClick={onNewExpense}
        title="Nouvelle dépense (Ctrl N)"
      />
      <nav className={styles.nav} aria-label="Navigation principale">
        <NavItem
          to="/"
          end
          icon="categories"
          label="Catégories"
          shortcut="Ctrl 1"
          pathname={pathname}
          activeFor={(p) => p.startsWith('/categories')}
        />
        <NavItem
          to="/fixes"
          icon="calendar"
          label="Dépenses fixes"
          shortcut="Ctrl 2"
          pathname={pathname}
        />
        <NavItem
          to="/historique"
          icon="history"
          label="Historique"
          shortcut="Ctrl 3"
          pathname={pathname}
        />
        <NavItem
          to="/evolution"
          icon="trendUp"
          label="Évolution"
          shortcut="Ctrl 4"
          pathname={pathname}
        />
      </nav>
      <div className={styles.spacer} />
      <div className={styles.footer}>
        <Button label="Réglages" variant="secondary" fullWidth onClick={onOpenSettings} />
        <p className={styles.storage}>
          <span className={styles.dot} aria-hidden="true" />
          <Text variant="caption-medium" as="span">
            Données enregistrées sur cet appareil
          </Text>
        </p>
      </div>
    </aside>
  )
}
