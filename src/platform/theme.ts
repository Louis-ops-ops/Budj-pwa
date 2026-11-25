import type { ThemeSetting, UiStyle } from '../shared/types'
import { platform } from './storage'
import { isStandalone } from './install'

// Read by public/theme-init.js before the first paint.
const THEME_MIRROR = 'budj-theme'
const UI_MIRROR = 'budj-ui'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

/** The user's theme setting. The style Pro displays dark whatever it is (Louis, v3 §4.3). */
let themeSetting: ThemeSetting = readMirror(THEME_MIRROR, ['system', 'light', 'dark'], 'system')
let uiStyle: UiStyle = readMirror(UI_MIRROR, ['playfull', 'pro'], 'playfull')

function readMirror<T extends string>(key: string, values: T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null
    return value !== null && values.includes(value) ? value : fallback
  } catch {
    return fallback
  }
}

function writeMirror(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // The mirror only avoids a flash: IndexedDB stays the source of truth.
  }
}

/** Element and token whose color the status bar takes (Pro hero), null = the app background. */
let statusSource: { element: Element; token: string } | null = null

function updateThemeColor(): void {
  // Installed app: the status bar is translucent (index.html), the page shows
  // through it. A theme-color changed at run time there can make iOS 26 lay
  // the web view out as if the status bar were opaque: 48 pt short, with a
  // black band at the bottom. The static metas of index.html stay.
  if (isStandalone()) return
  const color = statusSource
    ? getComputedStyle(statusSource.element).getPropertyValue(statusSource.token).trim()
    : getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim()
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', color))
}

/**
 * Pro hero: the browser bar takes the top color of the gradient. In the
 * installed app the status bar is translucent (index.html) and the gradient
 * itself shows through.
 */
export function setStatusBarSource(source: { element: Element; token: string } | null): void {
  statusSource = source
  updateThemeColor()
}

/** Theme really shown on <html>. */
export function displayedTheme(): ThemeSetting {
  return uiStyle === 'pro' ? 'dark' : themeSetting
}

function render(): void {
  const root = document.documentElement
  root.dataset.theme = displayedTheme()
  root.dataset.ui = uiStyle
  updateThemeColor()
}

/** The theme really displayed, "system" being resolved. */
export function resolveTheme(theme: ThemeSetting): 'light' | 'dark' {
  if (theme === 'system') return darkQuery.matches ? 'dark' : 'light'
  return theme
}

export function getThemeSetting(): ThemeSetting {
  return themeSetting
}

export function changeTheme(theme: ThemeSetting): void {
  themeSetting = theme
  writeMirror(THEME_MIRROR, theme)
  render()
  void platform.setTheme(theme)
}

/** Applies the UI style at once, without reload (the style itself lives in the data). */
export function applyUiStyle(style: UiStyle): void {
  if (style === uiStyle && document.documentElement.dataset.ui === style) return
  uiStyle = style
  writeMirror(UI_MIRROR, style)
  render()
}

/** Startup: IndexedDB wins over the mirror. */
export function syncTheme(): void {
  darkQuery.addEventListener('change', updateThemeColor)
  render()
  platform.getTheme().then((theme) => {
    themeSetting = theme
    writeMirror(THEME_MIRROR, theme)
    render()
  }, updateThemeColor)
}
