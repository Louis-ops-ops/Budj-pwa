import { useState } from 'react'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import { categoryPaint } from '../data/colors'
import { formatEuro, formatEuroShort } from '../data/money'
import { monthOf, todayISO } from '../data/dates'
import { categoryStatus } from '../data/selectors'
import { Dialog } from '../components/Dialog'
import { CategoryRow } from '../components/CategoryRow'
import { ColorSwatchPicker, type ColorChoice } from '../components/ColorSwatchPicker'
import { Text } from '../components/Text'
import styles from './Dialogs.module.css'

interface CategoryColorDialogProps {
  categoryId: string
  onClose(): void
}

/** Changes the color of an existing category (presets or custom hue). */
export function CategoryColorDialog({
  categoryId,
  onClose
}: CategoryColorDialogProps): React.JSX.Element | null {
  const data = useBudj((s) => s.data)
  const updateCategory = useBudj((s) => s.updateCategory)
  const toast = useUi((s) => s.toast)
  const category = data.categories.find((c) => c.id === categoryId)
  const [choice, setChoice] = useState<ColorChoice>(() => ({
    color: category?.color ?? 'vert',
    customHue: category?.customHue
  }))

  if (!category) return null
  const status = categoryStatus(data, monthOf(todayISO()), category)
  const unchanged = choice.color === category.color && choice.customHue === category.customHue

  const submit = (): void => {
    // A preset choice removes the custom hue.
    const { customHue: _drop, ...rest } = category
    void _drop
    updateCategory({ ...rest, ...choice })
    toast('Couleur enregistrée')
    onClose()
  }

  return (
    <Dialog
      title="Modifier la couleur"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Enregistrer"
      submitDisabled={unchanged}
    >
      <div className={styles.group}>
        <Text variant="label-medium" className={styles.groupLabel}>
          Aperçu
        </Text>
        <CategoryRow
          color={categoryPaint(choice)}
          name={category.name}
          detail={`Budget de ${formatEuroShort(status.budget)}`}
          spentLabel=""
          remaining={formatEuro(Math.abs(status.remaining))}
          remainingLabel={status.over ? 'de dépassement' : 'restants'}
          ratio={status.ratio}
          compact
        />
      </div>
      <div className={styles.group}>
        <Text variant="label-medium" className={styles.groupLabel}>
          Couleur
        </Text>
        <ColorSwatchPicker value={choice} onChange={setChoice} />
      </div>
    </Dialog>
  )
}
