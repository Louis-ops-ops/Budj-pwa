import { Dialog } from '../components/Dialog'
import { SettingsContent } from '../components/SettingsContent'

export function SettingsDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  return (
    <Dialog title="Réglages" onClose={onClose}>
      <SettingsContent />
    </Dialog>
  )
}
