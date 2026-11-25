// Height of the app, taken from the real screen in the installed iOS app.
// With a black-translucent status bar, iOS sometimes gives the page a
// viewport shorter than the screen by the status bar height (innerHeight,
// 100dvh and the fixed containing block all lose it): the bottom bars then
// float above the home indicator. The screen size does not lie, so the app
// is sized from it whenever it is installed and in portrait.
import { isStandalone } from './install'

function appHeight(): number {
  const portrait = window.matchMedia('(orientation: portrait)').matches
  // iOS reports screen.height in portrait whatever the orientation.
  if (isStandalone() && portrait && screen.height > window.innerHeight) return screen.height
  return window.innerHeight
}

function apply(): void {
  const height = appHeight()
  const root = document.documentElement.style
  root.setProperty('--app-height', `${height}px`)
  // What iOS took away: fixed bars anchored to the bottom go down by it.
  root.setProperty('--viewport-gap', `${Math.max(0, height - window.innerHeight)}px`)
}

export function syncViewport(): void {
  apply()
  for (const event of ['resize', 'orientationchange', 'pageshow'] as const) {
    window.addEventListener(event, apply)
  }
  document.addEventListener('visibilitychange', apply)
}

/** Shown under the version in the Settings, to check the phone. */
export function viewportReport(): string {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;visibility:hidden;padding-top:var(--safe-top);padding-bottom:var(--safe-bottom)'
  document.body.append(probe)
  const inset = getComputedStyle(probe)
  const top = parseFloat(inset.paddingTop)
  const bottom = parseFloat(inset.paddingBottom)
  probe.remove()
  return [
    `écran ${screen.height}`,
    `fenêtre ${window.innerHeight}`,
    `visible ${Math.round(window.visualViewport?.height ?? 0)}`,
    `app ${appHeight()}`,
    `zones ${top}/${bottom}`,
    isStandalone() ? 'installée' : 'onglet'
  ].join(' · ')
}
