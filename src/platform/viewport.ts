// Viewport measures shown in the Settings, to check the installed iOS app.
// With a black-translucent status bar, iOS 26 sometimes gives the app a web
// view shorter than the screen by the status bar height, and paints the rest
// in black under it: nothing in the page can draw there.
import { isStandalone } from './install'

// Window heights since the launch, to see when iOS changes it.
const heights = [window.innerHeight]
window.addEventListener('resize', () => {
  if (heights.at(-1) !== window.innerHeight) heights.push(window.innerHeight)
})

/** Shown under the version in the Settings: sizes, then status bar color and mode. */
export function viewportLines(): [string, string] {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;visibility:hidden;padding-top:var(--safe-top);padding-bottom:var(--safe-bottom)'
  document.body.append(probe)
  const inset = getComputedStyle(probe)
  const top = parseFloat(inset.paddingTop)
  const bottom = parseFloat(inset.paddingBottom)
  probe.remove()
  const color = document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? '–'
  return [
    `écran ${screen.height} · fenêtre ${heights.slice(-4).join('→')} · zones ${top}/${bottom}`,
    `couleur ${color} · ${isStandalone() ? 'installée' : 'onglet'}`
  ]
}

export function viewportReport(): string {
  return viewportLines().join(' · ')
}
