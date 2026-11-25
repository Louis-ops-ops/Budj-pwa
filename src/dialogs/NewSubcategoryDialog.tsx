import { useState } from 'react'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { isSubcategoryNameTaken } from '../data/mutations'
import { Dialog } from '../components/Dialog'
import { TextField } from '../components/Field'
import { CategoryChip, ChipList } from '../components/Chip'
import { Text } from '../components/Text'
import { useIsMobile } from '../ui/useIsMobile'
import { FormCard, SheetBlock, TextRow } from '../ui/shared/SheetParts'

interface NewSubcategoryDialogProps {
  onCreated?(subcategoryId: string): void
  onClose(): void
}

export function NewSubcategoryDialog({
  onCreated,
  onClose
}: NewSubcategoryDialogProps): React.JSX.Element {
  const isMobile = useIsMobile()
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

  if (isMobile) {
    return (
      <Dialog
        title="Nouvelle sous-catégorie"
        onClose={onClose}
        onSubmit={submit}
        submitLabel="Créer la sous-catégorie"
        submitDisabled={!trimmed || taken}
      >
        <FormCard>
          <TextRow
            label="Nom"
            value={name}
            onChange={setName}
            placeholder="Ex : Assurances"
            maxLength={30}
          />
        </FormCard>
        {taken && (
          <Text variant="label-regular" color="danger">
            Cette sous-catégorie existe déjà.
          </Text>
        )}
        <SheetBlock title="Tes sous-catégories de dépenses fixes">
          <ChipList label="Aperçu des sous-catégories">
            {data.fixedSubcategories.map((s) => (
              <CategoryChip
                key={s.id}
                label={s.name}
                color="bleu"
                selected={false}
                onClick={() => undefined}
              />
            ))}
            {trimmed && !taken && (
              <CategoryChip label={trimmed} color="bleu" selected onClick={() => undefined} />
            )}
          </ChipList>
        </SheetBlock>
        <Text variant="label-regular" color="secondary">
          Elles regroupent tes dépenses fixes dans l’écran Fixes. Le bleu reste réservé aux fixes.
        </Text>
      </Dialog>
    )
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
