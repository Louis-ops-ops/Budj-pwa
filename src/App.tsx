import { useEffect, useState } from 'react'
import { HashRouter, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useBudj } from './data/store'
import { useUi } from './ui/uiStore'
import { Sidebar } from './components/Sidebar'
import { TabBar } from './components/TabBar'
import { InstallBanner } from './components/InstallHelp'
import { ToastHost } from './components/Toast'
import { DialogHost } from './dialogs/DialogHost'
import { Splash, shouldShowSplash } from './components/Splash'
import { MyBudget } from './screens/MyBudget'
import { Onboarding } from './screens/Onboarding'
import { StorageIssueScreen } from './screens/StorageIssue'
import { CategoryDetail } from './screens/CategoryDetail'
import { FixedExpenses } from './screens/FixedExpenses'
import { History } from './screens/History'
import { Settings } from './screens/Settings'
import { Evolution } from './screens/Evolution'
import styles from './App.module.css'

const TAB_ROUTES = ['/', '/fixes', '/historique', '/evolution']
const TOP_LEVEL = [...TAB_ROUTES, '/reglages']

type PageTransition = 'none' | 'tab' | 'push' | 'pop'

/** Between tabs: a fade. Into a detail screen: from the right. Back: from the left. */
function transitionBetween(from: string, to: string): PageTransition {
  const fromTop = TOP_LEVEL.includes(from)
  const toTop = TOP_LEVEL.includes(to)
  if (fromTop && toTop) return 'tab'
  if (toTop) return 'pop'
  if (fromTop) return 'push'
  return to.split('/').length >= from.split('/').length ? 'push' : 'pop'
}

function Shell(): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const openDialog = useUi((s) => s.openDialog)

  // Global shortcuts (CLAUDE.md §9.1). Dialogs handle Escape / Enter themselves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return
      if (useUi.getState().dialogs.length > 0) return
      const key = e.key.toLowerCase()
      if (key === 'n') {
        e.preventDefault()
        const match = /^\/categories\/([^/]+)/.exec(window.location.hash.slice(1))
        openDialog({ kind: 'expense', categoryId: match?.[1] })
      } else if (key === 'k') {
        e.preventDefault()
        navigate('/historique', { state: { focusSearch: Date.now() } })
      } else if (['1', '2', '3', '4'].includes(key)) {
        e.preventDefault()
        navigate(TAB_ROUTES[Number(key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, openDialog])

  const categoryMatch = /^\/categories\/([^/]+)/.exec(location.pathname)

  const [page, setPage] = useState<{ path: string; transition: PageTransition }>({
    path: location.pathname,
    transition: 'none'
  })
  if (page.path !== location.pathname) {
    setPage({
      path: location.pathname,
      transition: transitionBetween(page.path, location.pathname)
    })
  }

  return (
    <div className={styles.shell}>
      <InstallBanner onOpen={() => navigate('/reglages')} />
      <Sidebar
        pathname={location.pathname}
        onNewExpense={() => openDialog({ kind: 'expense', categoryId: categoryMatch?.[1] })}
        onOpenSettings={() => openDialog({ kind: 'settings' })}
      />
      <div key={page.path} className={styles.route} data-transition={page.transition}>
        <Outlet />
      </div>
      <TabBar
        pathname={location.pathname}
        onAdd={() => openDialog({ kind: 'expense', categoryId: categoryMatch?.[1] })}
      />
    </div>
  )
}

export default function App(): React.JSX.Element | null {
  const ready = useBudj((s) => s.ready)
  const onboardingDone = useBudj((s) => s.data.onboardingDone)
  const storageIssue = useBudj((s) => s.storageIssue)
  const load = useBudj((s) => s.load)
  const [splash, setSplash] = useState(shouldShowSplash)

  useEffect(() => {
    void load()
  }, [load])

  const splashScreen = splash && <Splash ready={ready} onDone={() => setSplash(false)} />
  if (!ready) return splashScreen || null

  return (
    <>
      <HashRouter>
        {storageIssue ? (
          <StorageIssueScreen issue={storageIssue} />
        ) : onboardingDone ? (
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<MyBudget />} />
              <Route path="categories/:id" element={<CategoryDetail />} />
              <Route path="fixes" element={<FixedExpenses />} />
              <Route path="fixes/liste" element={<FixedExpenses list />} />
              <Route path="historique" element={<History />} />
              <Route path="reglages" element={<Settings />} />
              <Route path="evolution" element={<Evolution />} />
              <Route path="evolution/:month" element={<Evolution />} />
              <Route path="*" element={<MyBudget />} />
            </Route>
          </Routes>
        ) : (
          <Onboarding />
        )}
        <DialogHost />
        <ToastHost />
      </HashRouter>
      {splashScreen}
    </>
  )
}
