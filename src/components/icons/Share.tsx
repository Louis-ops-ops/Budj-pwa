// Same glyph as the iOS share sheet, for the install help.
import type { SVGProps } from 'react'

export function ShareIcon(props: SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11 15.5V6.8L8.4 9.4 7 8l5-5 5 5-1.4 1.4L13 6.8v8.7h-2Z" />
      <path d="M5 21V10h4v2H7v7h10v-7h-2v-2h4v11H5Z" />
    </svg>
  )
}
