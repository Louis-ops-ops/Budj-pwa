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

// Live badge (temporary diagnostic): every measure that could move the
// bottom bars, refreshed while the user navigates. Kept on across launches.
const BADGE_KEY = 'budj-viewport-badge'
let badge: HTMLElement | null = null
let timer = 0

function probeHeight(height: string): number {
  const probe = document.createElement('div')
  probe.style.cssText = `position:absolute;top:0;left:0;width:0;visibility:hidden;height:${height}`
  document.body.append(probe)
  const value = probe.offsetHeight
  probe.remove()
  return value
}

function measures(): string {
  const vv = window.visualViewport
  const root = document.getElementById('root')?.getBoundingClientRect()
  const navs = document.querySelectorAll('nav')
  const bar = navs[navs.length - 1]?.getBoundingClientRect()
  const r = (n: number | undefined): string => (n === undefined ? '–' : String(Math.round(n)))
  return [
    `iH ${window.innerHeight} vv ${r(vv?.height)}+${r(vv?.offsetTop)} sY ${r(window.scrollY)}`,
    `html ${document.documentElement.clientHeight}/${document.documentElement.scrollHeight} body ${document.body.scrollHeight}`,
    `dvh ${probeHeight('100dvh')} lvh ${probeHeight('100lvh')} svh ${probeHeight('100svh')} %${probeHeight('100%')}`,
    `root ${r(root?.top)}→${r(root?.bottom)} nav ${r(bar?.bottom)}`
  ].join('\n')
}

function showBadge(): void {
  if (badge) return
  badge = document.createElement('pre')
  badge.style.cssText =
    'position:fixed;top:calc(var(--safe-top) + var(--space-4));left:var(--space-4);z-index:1000;' +
    'margin:0;padding:var(--space-4);border-radius:var(--radius-xs);pointer-events:none;' +
    'background:var(--bg-sheet);color:var(--text-primary);box-shadow:var(--shadow-elevated);' +
    'font:var(--font-size-caption)/1.3 monospace'
  document.body.append(badge)
  const tick = (): void => {
    if (badge) badge.textContent = measures()
  }
  tick()
  timer = window.setInterval(tick, 250)
}

function hideBadge(): void {
  window.clearInterval(timer)
  badge?.remove()
  badge = null
}

export function isBadgeOn(): boolean {
  try {
    return localStorage.getItem(BADGE_KEY) === '1'
  } catch {
    return false
  }
}

export function toggleBadge(): boolean {
  const on = !isBadgeOn()
  try {
    if (on) localStorage.setItem(BADGE_KEY, '1')
    else localStorage.removeItem(BADGE_KEY)
  } catch {
    // Badge for this session only.
  }
  if (on) showBadge()
  else hideBadge()
  return on
}

if (isBadgeOn()) {
  if (document.body) showBadge()
  else window.addEventListener('DOMContentLoaded', showBadge)
}
