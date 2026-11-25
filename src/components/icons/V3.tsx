// Icons added with the v3 designs (Figma page Composants, « Icône/… »).
import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

/** Figma: Icône/Budget (388:1445) */
export function BudgetIcon(props: Props): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19 7.5C19 6.67228 18.3277 6 17.5 6H6.5C5.67228 6 5 6.67228 5 7.5V16.5C5 17.3277 5.67228 18 6.5 18H17.5C18.3277 18 19 17.3277 19 16.5V7.5ZM21 16.5C21 18.4323 19.4323 20 17.5 20H6.5C4.56772 20 3 18.4323 3 16.5V7.5C3 5.56772 4.56772 4 6.5 4H17.5C19.4323 4 21 5.56772 21 7.5V16.5Z" />
      <path d="M17 11C17.5523 11 18 11.4477 18 12C18 12.5523 17.5523 13 17 13H15C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11H17Z" />
      <path d="M20 8V10H4V8H20Z" />
    </svg>
  )
}

/** Figma: Icône/Plus (388:1426), the « … » of the Plus action. */
export function MoreIcon(props: Props): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M5.5 14C6.60457 14 7.5 13.1046 7.5 12C7.5 10.8954 6.60457 10 5.5 10C4.39543 10 3.5 10.8954 3.5 12C3.5 13.1046 4.39543 14 5.5 14Z" />
      <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" />
      <path d="M18.5 14C19.6046 14 20.5 13.1046 20.5 12C20.5 10.8954 19.6046 10 18.5 10C17.3954 10 16.5 10.8954 16.5 12C16.5 13.1046 17.3954 14 18.5 14Z" />
    </svg>
  )
}

/** Figma: Icône/Profil (Nav item / Profil) */
export function ProfileIcon(props: Props): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.0833 6.66667C12.0833 5.51607 11.1506 4.58333 10 4.58333C8.84941 4.58333 7.91667 5.51607 7.91667 6.66667C7.91667 7.81726 8.84941 8.75 10 8.75C11.1506 8.75 12.0833 7.81726 12.0833 6.66667ZM13.75 6.66667C13.75 8.73774 12.0711 10.4167 10 10.4167C7.92893 10.4167 6.25 8.73774 6.25 6.66667C6.25 4.5956 7.92893 2.91667 10 2.91667C12.0711 2.91667 13.75 4.5956 13.75 6.66667Z" />
      <path d="M10 11.25C13.1473 11.25 15.8634 13.0301 16.6406 16.0417C16.7556 16.4873 16.4873 16.9423 16.0417 17.0573C15.596 17.1723 15.141 16.904 15.026 16.4583C14.4699 14.3033 12.5193 12.9167 10 12.9167C7.48066 12.9167 5.5301 14.3033 4.97396 16.4583C4.85896 16.904 4.40397 17.1723 3.95833 17.0573C3.5127 16.9423 3.24437 16.4873 3.35938 16.0417C4.13656 13.0301 6.85268 11.25 10 11.25Z" />
    </svg>
  )
}

/** Check mark (Icône/Coche), drawn on the 24 grid. */
export function CheckIcon(props: Props): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M9.55 18L3.85 12.3L5.275 10.875L9.55 15.15L18.725 5.975L20.15 7.4L9.55 18Z" />
    </svg>
  )
}
