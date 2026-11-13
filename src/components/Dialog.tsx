import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import type { IconName } from './Icon'
import { IconButton } from './IconButton'
import { Text } from './Text'
import styles from './Dialog.module.css'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Bottom sheet: dragged further than this, it closes.
const CLOSE_DRAG_PX = 96

/** True while the dialog plays its exit animation (set by DialogHost). */
export const DialogClosing = createContext(false)

// The keyboard is open when it takes more than this from the viewport.
const KEYBOARD_MIN_PX = 120

// Stack of open dialogs: only the topmost one reacts to Escape and traps focus.
const stack: string[] = []

interface DialogProps {
  title: string
  onClose(): void
  /** Called on Enter / primary button. */
  onSubmit?(): void
  submitLabel?: string
  submitIcon?: IconName
  submitDisabled?: boolean
  submitVariant?: 'primary' | 'danger'
  cancelLabel?: string
  /** Left side of the footer (text link). */
  footerStart?: ReactNode
  /** Right side of the header, before the close button. */
  headerExtra?: ReactNode
  size?: 'regular' | 'small'
  children: ReactNode
}

export function Dialog({
  title,
  onClose,
  onSubmit,
  submitLabel,
  submitIcon,
  submitDisabled,
  submitVariant = 'primary',
  cancelLabel = 'Annuler',
  footerStart,
  headerExtra,
  size = 'regular',
  children
}: DialogProps): React.JSX.Element {
  const id = useId()
  const titleId = `${id}-title`
  const ref = useRef<HTMLFormElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)
  const [dragY, setDragY] = useState(0)
  const closing = useContext(DialogClosing)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    stack.push(id)
    const node = ref.current
    // Focus the element marked autofocus, or the first focusable one.
    const target =
      node?.querySelector<HTMLElement>('[data-autofocus]') ??
      node?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()

    const onKey = (e: KeyboardEvent): void => {
      if (stack[stack.length - 1] !== id || !node) return
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
      } else if (e.key === 'Tab') {
        const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      stack.splice(stack.indexOf(id), 1)
      previous?.focus?.()
    }
  }, [id])

  // The overlay follows the visual viewport, so the sheet stays above the keyboard.
  // With the keyboard open, the sheet takes the whole height and scrolls.
  useEffect(() => {
    const viewport = window.visualViewport
    const overlay = overlayRef.current
    if (!viewport || !overlay) return
    const update = (): void => {
      overlay.style.setProperty('--viewport-top', `${viewport.offsetTop}px`)
      overlay.style.setProperty('--viewport-height', `${viewport.height}px`)
      const keyboard = window.innerHeight - viewport.height > KEYBOARD_MIN_PX
      overlay.toggleAttribute('data-keyboard', keyboard)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  const startDrag = (e: PointerEvent<HTMLDivElement>): void => {
    dragStart.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const moveDrag = (e: PointerEvent<HTMLDivElement>): void => {
    if (dragStart.current !== null) setDragY(Math.max(0, e.clientY - dragStart.current))
  }

  const endDrag = (): void => {
    dragStart.current = null
    if (dragY > CLOSE_DRAG_PX) onClose()
    else setDragY(0)
  }

  const submit = (e: FormEvent): void => {
    e.preventDefault()
    if (!submitDisabled) onSubmit?.()
  }

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      data-closing={closing || undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[styles.dialog, size === 'small' ? styles.small : ''].join(' ')}
        onSubmit={submit}
        noValidate
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div
          className={styles.handleArea}
          aria-hidden="true"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span className={styles.handle} />
        </div>
        <div className={styles.header}>
          <Text variant="h1" as="h2" id={titleId}>
            {title}
          </Text>
          <div className={styles.headerSide}>
            {headerExtra}
            {/* The "add" glyph turned 45° is the close cross. */}
            <IconButton
              icon="add"
              iconRotate={45}
              label="Fermer (Échap)"
              className={styles.close}
              onClick={onClose}
            />
          </div>
        </div>
        <div className={styles.body}>{children}</div>
        {(onSubmit || footerStart) && (
          <div className={styles.footer}>
            {footerStart}
            <div className={styles.footerButtons}>
              <Button label={cancelLabel} variant="secondary" onClick={onClose} />
              {onSubmit && submitLabel && (
                <Button
                  label={submitLabel}
                  icon={submitIcon}
                  type="submit"
                  variant={submitVariant}
                  disabled={submitDisabled}
                />
              )}
            </div>
          </div>
        )}
      </form>
    </div>,
    document.body
  )
}

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm(): void
  onClose(): void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger = true,
  onConfirm,
  onClose
}: ConfirmDialogProps): React.JSX.Element {
  return (
    <Dialog
      title={title}
      onClose={onClose}
      onSubmit={() => {
        onConfirm()
        onClose()
      }}
      submitLabel={confirmLabel}
      submitVariant={danger ? 'danger' : 'primary'}
      size="small"
    >
      <Text variant="body-regular" color="tertiary">
        {message}
      </Text>
    </Dialog>
  )
}
