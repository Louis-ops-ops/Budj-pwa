// Logic of Réglages (v3 §7.10), shared by Playfull and Pro.
import { viewportLines } from '../platform/viewport'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import type { ThemeSetting, UiStyle } from '../shared/types'
import { useBudj } from '../data/store'
import { pickImport } from '../dialogs/SettingsDialogs'
import { platform, type StorageStatus } from '../platform/storage'
import { changeTheme, getThemeSetting } from '../platform/theme'
import { useUi } from '../ui/uiStore'

const THEME_LABELS: Record<ThemeSetting, string> = {
  system: 'Système',
  light: 'Clair',
  dark: 'Sombre'
}

const STYLE_LABELS: Record<UiStyle, string> = { playfull: 'Playfull', pro: 'Pro' }

/** The style row keeps the focus when the other style's screen replaces this one (v3 §9). */
let focusStyleRow = false
export const STYLE_ROW_ID = 'setting-ui-style'

export function useSettings() {
  const settings = useBudj((s) => s.data.settings)
  const updateSettings = useBudj((s) => s.updateSettings)
  const openDialog = useUi((s) => s.openDialog)
  const navigate = useNavigate()
  const [theme, setTheme] = useState<ThemeSetting>(getThemeSetting)
  const [status, setStatus] = useState<StorageStatus | null>(null)

  useEffect(() => {
    void platform.getStorageStatus().then(setStatus)
    if (focusStyleRow) {
      focusStyleRow = false
      document.getElementById(STYLE_ROW_ID)?.querySelector('button')?.focus()
    }
  }, [])

  const pro = settings.uiStyle === 'pro'
  const reminders = settings.reminders

  return {
    settings,
    reminders,
    status,
    pro,
    themeLabel: pro ? 'Sombre (Pro)' : THEME_LABELS[theme],
    styleLabel: STYLE_LABELS[settings.uiStyle],
    version: __APP_VERSION__,
    viewport: viewportLines(),
    actions: {
      back: () => navigate(-1),
      setReminder: (patch: Partial<typeof reminders>) =>
        updateSettings({ reminders: { ...reminders, ...patch } }),
      editReminderTime: () => openDialog({ kind: 'reminderTime' }),
      setShowCents: (showCents: boolean) => updateSettings({ showCents }),
      chooseTheme: () =>
        openDialog({
          kind: 'choice',
          title: 'Thème',
          value: theme,
          options: (Object.keys(THEME_LABELS) as ThemeSetting[]).map((value) => ({
            value,
            label: THEME_LABELS[value],
            hint: value === 'system' ? 'Suit le réglage de ton téléphone' : undefined
          })),
          note: pro ? 'Le style Pro est toujours en sombre : ce thème s’appliquera en Playfull.' : undefined,
          onSelect: (value) => {
            setTheme(value as ThemeSetting)
            changeTheme(value as ThemeSetting)
          }
        }),
      chooseStyle: () =>
        openDialog({
          kind: 'choice',
          title: 'Style d’UI',
          value: settings.uiStyle,
          options: [
            { value: 'playfull', label: 'Playfull', hint: 'Cartes colorées et grands chiffres' },
            { value: 'pro', label: 'Pro', hint: 'Dégradés et listes groupées, en sombre' }
          ],
          note: 'Même app, mêmes données : seule la présentation change.',
          onSelect: (value) => {
            if (value === settings.uiStyle) return
            focusStyleRow = true
            updateSettings({ uiStyle: value as UiStyle })
          }
        }),
      exportData: () => openDialog({ kind: 'export' }),
      importData: () => void pickImport(),
      reset: () => openDialog({ kind: 'reset' })
    }
  }
}
