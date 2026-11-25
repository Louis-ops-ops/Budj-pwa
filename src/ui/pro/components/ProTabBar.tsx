import { Link } from 'react-router'
import { Icon, type IconName } from '../../../components/Icon'
import styles from './ProTabBar.module.css'

const TABS: { to: string; label: string; icon: IconName; activeFor?: RegExp }[] = [
  { to: '/', label: 'Accueil', icon: 'categories', activeFor: /^\/(categories|budget|profil|reglages)/ },
  { to: '/fixes', label: 'Fixes', icon: 'calendar', activeFor: /^\/fixes/ },
  { to: '/historique', label: 'Historique', icon: 'history' },
  { to: '/evolution', label: 'Évolution', icon: 'trendUp', activeFor: /^\/evolution/ }
]

/** Figma: Pro/Tab bar (389:1504). Filled « + » then a floating pill with 4 tabs. */
export function ProTabBar({
  pathname,
  onAdd
}: {
  pathname: string
  onAdd(): void
}): React.JSX.Element {
  return (
    <div className={styles.container}>
      <button type="button" className={styles.add} aria-label="Nouvelle dépense" onClick={onAdd}>
        <Icon name="add" size={24} />
      </button>
      <nav className={styles.tabs} aria-label="Navigation principale">
        {TABS.map((tab) => {
          const active = tab.to === pathname || Boolean(tab.activeFor?.test(pathname))
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={styles.item}
            >
              <Icon name={tab.icon} size={20} />
              <span className="t-caption-medium">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
