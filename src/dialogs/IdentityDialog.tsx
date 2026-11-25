import { useState } from 'react'
import { AVATAR_COLORS, type AvatarColor } from '../shared/types'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { useIsMobile } from '../ui/useIsMobile'
import { CategoryChip, ChipList } from '../components/Chip'
import { Dialog } from '../components/Dialog'
import { TextField } from '../components/Field'
import { TextLink } from '../components/TextLink'
import { ProfileAvatar } from '../ui/shared/ProfileAvatar'
import styles from './Dialogs.module.css'

const COLOR_LABELS: Record<AvatarColor, string> = {
  bleu: 'Bleu',
  vert: 'Vert',
  mauve: 'Mauve',
  orange: 'Orange',
  rouge: 'Rouge',
  cyan: 'Cyan'
}

/** Profile › identity: first name and avatar color. */
export function IdentityDialog({ onClose }: { onClose(): void }): React.JSX.Element {
  const isMobile = useIsMobile()
  const settings = useBudj((s) => s.data.settings)
  const updateSettings = useBudj((s) => s.updateSettings)
  const toast = useUi((s) => s.toast)
  const [name, setName] = useState(settings.firstName)
  const [color, setColor] = useState<AvatarColor>(settings.avatarColor)

  return (
    <Dialog
      title="Mon profil"
      onClose={onClose}
      onSubmit={() => {
        updateSettings({ firstName: name.trim(), avatarColor: color })
        toast('Profil enregistré')
        onClose()
      }}
      submitLabel="Enregistrer"
      footerStart={isMobile && <TextLink label="Annuler" onClick={onClose} />}
    >
      <div className={styles.centerLink}>
        <ProfileAvatar initial={(name.trim() || 'B').charAt(0).toUpperCase()} color={color} />
      </div>
      <TextField label="Prénom" value={name} onChange={setName} autoComplete="given-name" maxLength={40} />
      <ChipList label="Couleur de l’avatar">
        {AVATAR_COLORS.map((c) => (
          <CategoryChip
            key={c}
            label={COLOR_LABELS[c]}
            color={c}
            selected={c === color}
            onClick={() => setColor(c)}
          />
        ))}
      </ChipList>
    </Dialog>
  )
}
