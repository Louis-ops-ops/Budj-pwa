// Viewport measures shown in the Settings, to check the installed iOS app.
// With a black-translucent status bar, iOS 26 sometimes gives the app a web
// view shorter than the screen by the status bar height, and paints the rest
// in black under it: nothing in the page can draw there.
import { isStandalone } from './install'

/** Shown under the version in the Settings. */
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
    `zones ${top}/${bottom}`,
    isStandalone() ? 'installée' : 'onglet'
  ].join(' · ')
}
