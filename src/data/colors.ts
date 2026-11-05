// Category colors: the 5 presets come from the theme tokens; a custom hue gets a
// light + dark pair computed here so that text always meets WCAG AA (4.5:1).
import type { Category, CategoryColor } from '../shared/types'

/** Background + foreground CSS values for a category (tone-on-tone). */
export interface Paint {
  bg: string
  fg: string
}

export const MIN_CONTRAST = 4.5

// Surfaces a category color is drawn on or next to, per theme (from the primitives:
// bg/surface, bg/app, bg/sheet, text/on-accent).
const LIGHT_SURFACES = ['#FFFFFF', '#FBFBFB', '#F6F6F6']
const DARK_SURFACES = ['#1E2026', '#17181D', '#111114']

export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const lig = l / 100
  const k = (n: number): number => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number): number => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const hex = (x: number): string =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`.toUpperCase()
}

function luminance(hex: string): number {
  const channel = (i: number): number => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const minContrast = (fg: string, backgrounds: string[]): number =>
  Math.min(...backgrounds.map((b) => contrast(fg, b)))

export interface HuePalette {
  light: { bg: string; fg: string }
  dark: { bg: string; fg: string }
}

/**
 * Tone-on-tone pair for a hue: pale background + dark text in light mode,
 * deep background + pale text in dark mode. The text lightness is moved until it
 * reaches 4.5:1 against its own background and every surface of the theme.
 */
export function huePalette(hue: number): HuePalette {
  const h = ((Math.round(hue) % 360) + 360) % 360

  const lightBg = hslToHex(h, 75, 93)
  let lightL = 32
  let lightFg = hslToHex(h, 80, lightL)
  while (minContrast(lightFg, [lightBg, ...LIGHT_SURFACES]) < MIN_CONTRAST && lightL > 5) {
    lightL -= 1
    lightFg = hslToHex(h, 80, lightL)
  }

  const darkBg = hslToHex(h, 25, 14)
  let darkL = 74
  let darkFg = hslToHex(h, 55, darkL)
  while (minContrast(darkFg, [darkBg, ...DARK_SURFACES]) < MIN_CONTRAST && darkL < 97) {
    darkL += 1
    darkFg = hslToHex(h, 55, darkL)
  }

  return { light: { bg: lightBg, fg: lightFg }, dark: { bg: darkBg, fg: darkFg } }
}

/** Contrast of the weakest pair of a hue, for display ("7,2:1"). */
export function hueContrast(hue: number): number {
  const p = huePalette(hue)
  return Math.min(
    minContrast(p.light.fg, [p.light.bg, ...LIGHT_SURFACES]),
    minContrast(p.dark.fg, [p.dark.bg, ...DARK_SURFACES])
  )
}

/** Paint of a preset color (tokens follow the theme on their own). */
export function presetPaint(color: CategoryColor | 'bleu'): Paint {
  return { bg: `var(--category-${color}-bg)`, fg: `var(--category-${color}-fg)` }
}

/** Paint of a custom hue: light-dark() picks the right pair for the active theme. */
export function huePaint(hue: number): Paint {
  const p = huePalette(hue)
  return {
    bg: `light-dark(${p.light.bg}, ${p.dark.bg})`,
    fg: `light-dark(${p.light.fg}, ${p.dark.fg})`
  }
}

export function categoryPaint(category: Pick<Category, 'color' | 'customHue'>): Paint {
  return category.customHue !== undefined
    ? huePaint(category.customHue)
    : presetPaint(category.color)
}

/** Vivid color of a hue, only used to draw the slider track. */
export function hueSample(hue: number): string {
  return hslToHex(hue, 80, 50)
}

/** Accepts a preset name or a ready-made paint. */
export function toPaint(color: CategoryColor | 'bleu' | Paint): Paint {
  return typeof color === 'string' ? presetPaint(color) : color
}

/** A token name ("bg-accent") or a raw CSS color value (from a Paint). */
export function cssColor(tokenOrValue: string): string {
  return tokenOrValue.includes('(') || tokenOrValue.startsWith('#')
    ? tokenOrValue
    : `var(--${tokenOrValue})`
}
