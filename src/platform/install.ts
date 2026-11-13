import { create } from 'zustand'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

export type InstallMode = 'installed' | 'prompt' | 'ios' | 'unavailable'

export const isStandalone = (): boolean =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches

// iPadOS presents itself as a Mac, touch tells them apart.
const isIos = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)

interface InstallState {
  promptEvent: BeforeInstallPromptEvent | null
  installed: boolean
  install(): Promise<void>
}

export const useInstall = create<InstallState>()((set, get) => ({
  promptEvent: null,
  installed: isStandalone(),

  async install() {
    await get().promptEvent?.prompt()
    set({ promptEvent: null })
  }
}))

export function useInstallMode(): InstallMode {
  const installed = useInstall((s) => s.installed)
  const promptEvent = useInstall((s) => s.promptEvent)
  if (installed) return 'installed'
  if (promptEvent) return 'prompt'
  return isIos() ? 'ios' : 'unavailable'
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  useInstall.setState({ promptEvent: e as BeforeInstallPromptEvent })
})

window.addEventListener('appinstalled', () => {
  useInstall.setState({ installed: true, promptEvent: null })
})
