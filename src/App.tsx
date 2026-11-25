import { Suspense, useEffect, useState } from 'react'
import { HashRouter, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useBudj } from './data/store'
import { useUi } from './ui/uiStore'
import { Sidebar } from './components/Sidebar'
import { InstallBanner } from './components/InstallHelp'
import { ToastHost } from './components/Toast'
import { DialogHost } from './dialogs/DialogHost'
import { Splash, shouldShowSplash } from './components/Splash'
import { StorageIssueScreen } from './screens/StorageIssue'
import { StyledScreen } from './app/StyledScreen'
import { applyUiStyle } from './platform/theme'
import { setShowCents } from './data/money'
import { useReminders } from './features/useReminders'
import styles from './App.module.css'

const TAB_ROUTES = ['/', '/fixes', '/historique', '/evolution']
const TOP_LEVEL = [...TAB_ROUTES, '/profil', '/reglages']

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
  const chromeHidden = useUi((s) => s.chromeHidden)

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
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        {!chromeHidden && <StyledScreen
          name="TabBar"
          pathname={location.pathname}
          onAdd={() => openDialog({ kind: 'expense', categoryId: categoryMatch?.[1] })}
        />}
      </Suspense>
    </div>
  )
}

export default function App(): React.JSX.Element | null {
  const ready = useBudj((s) => s.ready)
  const onboardingDone = useBudj((s) => s.data.onboardingDone)
  const storageIssue = useBudj((s) => s.storageIssue)
  const load = useBudj((s) => s.load)
  const uiStyle = useBudj((s) => s.data.settings.uiStyle)
  const showCents = useBudj((s) => s.data.settings.showCents)
  // Set during render so that every amount of this render already follows the setting.
  setShowCents(showCents)
  const [splash, setSplash] = useState(shouldShowSplash)

  useEffect(() => {
    void load()
  }, [load])

  useReminders(ready && onboardingDone)

  // Before the data is read, the style comes from the mirror applied by theme-init.js.
  useEffect(() => {
    if (ready) applyUiStyle(uiStyle)
  }, [ready, uiStyle])

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
              <Route index element={<StyledScreen name="MyBudget" />} />
              <Route path="categories/:id" element={<StyledScreen name="CategoryDetail" />} />
              <Route path="categories" element={<StyledScreen name="ManageCategories" />} />
              <Route path="budget" element={<StyledScreen name="Budget" />} />
              <Route path="profil" element={<StyledScreen name="Profile" />} />
              <Route path="fixes" element={<StyledScreen name="FixedExpenses" />} />
              <Route path="fixes/liste" element={<StyledScreen name="FixedExpenses" />} />
              <Route path="fixes/calendrier" element={<StyledScreen name="FixedExpenses" calendar />} />
              <Route path="historique" element={<StyledScreen name="History" />} />
              <Route path="reglages" element={<StyledScreen name="Settings" />} />
              <Route path="evolution" element={<StyledScreen name="Evolution" />} />
              <Route path="evolution/:month" element={<StyledScreen name="Evolution" />} />
              <Route path="*" element={<StyledScreen name="MyBudget" />} />
            </Route>
          </Routes>
        ) : (
          <Suspense fallback={null}>
            <StyledScreen name="Onboarding" />
          </Suspense>
        )}
        <DialogHost />
        <ToastHost />
      </HashRouter>
      {splashScreen}
    </>
  )
}
