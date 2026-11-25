import './theme/global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { syncTheme } from './platform/theme'

syncTheme()

// iOS keeps the keyboard open until another field takes the focus: a tap on
// anything that is not a control closes it. Controls keep it, so a tap on a
// button does not move the layout under the finger.
const CONTROL = 'input, textarea, select, button, a, label, [role="button"], [data-keeps-keyboard]'
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return
  const active = document.activeElement
  if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) return
  if (e.target instanceof Element && e.target.closest(CONTROL)) return
  active.blur()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
