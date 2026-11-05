import { useEffect } from 'react'
import { HashRouter, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useBudj } from './data/store'
import { useUi } from './ui/uiStore'
import { Sidebar } from './components/Sidebar'
import { TabBar } from './components/TabBar'
import { InstallBanner } from './components/InstallHelp'
import { ToastHost } from './components/Toast'
import { DialogHost } from './dialogs/DialogHost'
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

  return (
    <div className={styles.shell}>
      <InstallBanner onOpen={() => navigate('/reglages')} />
      <Sidebar
        pathname={location.pathname}
        onNewExpense={() => openDialog({ kind: 'expense', categoryId: categoryMatch?.[1] })}
        onOpenSettings={() => openDialog({ kind: 'settings' })}
      />
      <Outlet />
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

  useEffect(() => {
    void load()
  }, [load])

  if (!ready) return null

  return (
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
  )
}
