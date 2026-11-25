import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { setStatusBarSource } from '../../../platform/theme'
import type { Paint } from '../../../data/colors'
import styles from './ProPage.module.css'

export type Hero = 'home' | 'fixed' | 'history' | 'evolution' | 'category' | 'none'

/**
 * Pro screen: hero gradient (≈ 600 px) behind the content, scrolling with it,
 * and the bottom fade under the tab bar (v3 §4.2).
 */
export function ProPage({
  hero,
  paint,
  children,
  label
}: {
  hero: Hero
  /** Category hero: its colors. */
  paint?: Paint
  children: ReactNode
  label?: string
}): React.JSX.Element {
  const style = paint ? ({ '--cat-bg': paint.bg, '--cat-fg': paint.fg } as CSSProperties) : undefined
  const scrollRef = useRef<HTMLDivElement>(null)
  useStatusBar(scrollRef, hero)
  return (
    <main className={styles.page} aria-label={label}>
      <div ref={scrollRef} className={styles.scroll} data-hero={hero} style={style}>
        <div className={styles.gradient} aria-hidden="true" />
        <div className={styles.content}>{children}</div>
      </div>
      <div className={styles.fade} aria-hidden="true" />
    </main>
  )
}

/** Side margins of the lists (24 px), the hero spans the full width. */
export function ProSection({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className={styles.section}>{children}</div>
}

/** Top color of each hero gradient (tokens.css, --pro-hero-…). */
const HERO_TOP: Record<Hero, string> = {
  home: '--bg-accent',
  fixed: '--bg-brand-strong',
  history: '--bg-brand-muted',
  evolution: '--border-brand',
  category: '--cat-bg',
  none: '--bg-app'
}

/** The status bar matches the top of the hero while this screen is shown. */
export function useStatusBar(ref: React.RefObject<Element | null>, hero: Hero): void {
  useEffect(() => {
    if (!ref.current) return
    setStatusBarSource({ element: ref.current, token: HERO_TOP[hero] })
    return () => setStatusBarSource(null)
  }, [ref, hero])
}
