// Shows the due in-app reminders when the app opens or comes back (v3 §7.13).
import { useEffect } from 'react'
import { todayISO } from '../data/dates'
import { dueReminders, type SeenReminders } from '../data/reminders'
import { useBudj } from '../data/store'
import { platform } from '../platform/storage'
import { useUi } from '../ui/uiStore'

const pad = (n: number): string => String(n).padStart(2, '0')

async function check(): Promise<void> {
  const { data, ready } = useBudj.getState()
  if (!ready) return
  const now = new Date()
  const today = todayISO(now)
  const seen = (await platform.getSeenReminders().catch(() => ({}))) as SeenReminders
  for (const reminder of dueReminders(data, today, `${pad(now.getHours())}:${pad(now.getMinutes())}`, seen)) {
    useUi.getState().toast(reminder.message)
    await platform.markReminderSeen(reminder.kind, today).catch(() => undefined)
  }
}

export function useReminders(ready: boolean): void {
  useEffect(() => {
    if (!ready) return
    void check()
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [ready])
}
