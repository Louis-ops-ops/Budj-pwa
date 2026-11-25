import { use, type ComponentType } from 'react'
import type { UiStyle } from '../shared/types'
import { useBudj } from '../data/store'
import { useIsMobile } from '../ui/useIsMobile'
import type { ScreenName, StyleModule } from '../ui/styleModule'

// One chunk per style: the app only downloads the style in use (v3 §3.2).
// The service worker precaches both, so either opens offline.
const loaders: Record<UiStyle, () => Promise<{ default: StyleModule }>> = {
  playfull: () => import('../ui/playfull'),
  pro: () => import('../ui/pro')
}

const cache = new Map<UiStyle, Promise<StyleModule>>()

export function loadStyle(style: UiStyle): Promise<StyleModule> {
  let promise = cache.get(style)
  if (!promise) {
    promise = loaders[style]().then((m) => m.default)
    cache.set(style, promise)
  }
  return promise
}

/** Style shown: the user's on mobile; the desktop layout (≥ 1024 px) only exists in Playfull. */
export function useUiStyle(): UiStyle {
  const style = useBudj((s) => s.data.settings.uiStyle)
  return useIsMobile() ? style : 'playfull'
}

/**
 * A route renders `<StyledScreen name="CategoryDetail" />`: the screen of the
 * current style, or the Playfull one while Pro does not have it.
 * Must be under a <Suspense> boundary.
 */
export function StyledScreen<N extends ScreenName>({
  name,
  ...props
}: { name: N } & Record<string, unknown>): React.JSX.Element {
  const style = useUiStyle()
  const module = use(loadStyle(style))
  const Own = module.screens[name] as ComponentType<Record<string, unknown>> | undefined
  if (Own) return <Own {...props} />
  return <PlayfullScreen name={name} {...props} />
}

function PlayfullScreen({
  name,
  ...props
}: { name: ScreenName } & Record<string, unknown>): React.JSX.Element {
  const module = use(loadStyle('playfull'))
  const Screen = module.screens[name] as ComponentType<Record<string, unknown>>
  return <Screen {...props} />
}
