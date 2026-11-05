import { Link } from 'react-router'
import { Icon, type IconName } from './Icon'
import styles from './TabBar.module.css'

const TABS: { to: string; label: string; icon: IconName; activeFor?: RegExp }[] = [
  { to: '/', label: 'Catégories', icon: 'categories', activeFor: /^\/(categories|fixes\/liste)/ },
  { to: '/fixes', label: 'Fixes', icon: 'calendar' },
  { to: '/historique', label: 'Historique', icon: 'history' },
  { to: '/evolution', label: 'Évolution', icon: 'trendUp', activeFor: /^\/evolution/ },
  { to: '/reglages', label: 'Réglages', icon: 'settings' }
]

/** Bottom navigation below the desktop breakpoint (Figma: Nav bar 187:1482). */
export function TabBar({
  pathname,
  onAdd
}: {
  pathname: string
  onAdd(): void
}): React.JSX.Element {
  return (
    <div className={styles.container}>
      <button type="button" className={styles.add} aria-label="Nouvelle dépense" onClick={onAdd}>
        <Icon name="add" size={20} />
      </button>
      <nav className={styles.tabs} aria-label="Navigation principale">
        {TABS.map((tab) => {
          const active = tab.to === pathname || Boolean(tab.activeFor?.test(pathname))
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className={[styles.item, active ? styles.active : ''].join(' ')}
            >
              <Icon name={tab.icon} size={20} />
              {active && <span className="t-label-bold">{tab.label}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
