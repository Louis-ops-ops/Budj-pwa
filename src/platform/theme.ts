import type { ThemeSetting } from '../shared/types'
import { platform } from './storage'

// Read by public/theme-init.js before the first paint.
const MIRROR_KEY = 'budj-theme'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function updateThemeColor(): void {
  const color = getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim()
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', color))
}

function applyTheme(theme: ThemeSetting): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(MIRROR_KEY, theme)
  } catch {
    // The mirror only avoids a flash: IndexedDB stays the source of truth.
  }
  updateThemeColor()
}

/** The theme really displayed, "system" being resolved. */
export function resolveTheme(theme: ThemeSetting): 'light' | 'dark' {
  if (theme === 'system') return darkQuery.matches ? 'dark' : 'light'
  return theme
}

export function changeTheme(theme: ThemeSetting): void {
  applyTheme(theme)
  void platform.setTheme(theme)
}

/** Startup: IndexedDB wins over the mirror. */
export function syncTheme(): void {
  darkQuery.addEventListener('change', updateThemeColor)
  platform.getTheme().then((theme) => changeTheme(resolveTheme(theme)), updateThemeColor)
}
