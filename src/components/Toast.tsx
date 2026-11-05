import { useRegisterSW } from 'virtual:pwa-register/react'
import { flushSave } from '../data/store'
import { useUi } from '../ui/uiStore'
import { Text } from './Text'
import styles from './Toast.module.css'

/** Stays until the user reloads: a reload never interrupts what is being typed. */
function UpdateToast(): React.JSX.Element | null {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW()
  if (!needRefresh) return null

  const reload = async (): Promise<void> => {
    await flushSave()
    await updateServiceWorker(true)
  }

  return (
    <div className={`${styles.toast} ${styles.update}`}>
      <Text variant="body-medium" color="on-accent">
        Une nouvelle version de Budj est prête
      </Text>
      <button
        type="button"
        className={`t-label-bold ${styles.action}`}
        onClick={() => void reload()}
      >
        Recharger
      </button>
    </div>
  )
}

/** Short message bottom-right, 3 s. */
export function ToastHost(): React.JSX.Element {
  const toasts = useUi((s) => s.toasts)
  return (
    <div className={styles.host} role="status" aria-live="polite">
      <UpdateToast />
      {toasts.map((t) => (
        <div key={t.id} className={styles.toast}>
          <Text variant="body-medium" color="on-accent">
            {t.message}
          </Text>
        </div>
      ))}
    </div>
  )
}
