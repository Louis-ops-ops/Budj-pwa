import { useState } from 'react'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { isSubcategoryNameTaken } from '../data/mutations'
import { Dialog } from '../components/Dialog'
import { TextField } from '../components/Field'

interface NewSubcategoryDialogProps {
  onCreated?(subcategoryId: string): void
  onClose(): void
}

export function NewSubcategoryDialog({
  onCreated,
  onClose
}: NewSubcategoryDialogProps): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const addFixedSubcategory = useBudj((s) => s.addFixedSubcategory)
  const toast = useUi((s) => s.toast)
  const [name, setName] = useState('')
  const trimmed = name.trim()
  const taken = trimmed !== '' && isSubcategoryNameTaken(data, trimmed)

  const submit = (): void => {
    if (!trimmed || taken) return
    const sub = addFixedSubcategory(trimmed)
    toast(`Sous-catégorie « ${sub.name} » créée`)
    onClose()
    onCreated?.(sub.id)
  }

  return (
    <Dialog
      title="Nouvelle sous-catégorie"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Créer"
      submitDisabled={!trimmed || taken}
      size="small"
    >
      <TextField
        label="Nom"
        value={name}
        onChange={setName}
        placeholder="Ex. Assurances"
        maxLength={30}
        autoFocusOnOpen
        error={taken ? 'Cette sous-catégorie existe déjà.' : undefined}
      />
    </Dialog>
  )
}
