import { useSyncExternalStore } from 'react'

// Same breakpoint as the CSS: below it, TabBar and bottom sheets replace the desktop layout.
const query = window.matchMedia('(max-width: 1023px)')

const subscribe = (onChange: () => void): (() => void) => {
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => query.matches)
}
