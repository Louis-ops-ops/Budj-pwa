import { useState, type CSSProperties } from 'react'
import { useBudj } from '../data/store'
import { useUi } from '../ui/uiStore'
import * as sel from '../data/selectors'
import { isCategoryNameTaken } from '../data/mutations'
import { amountTextToCents, formatEuro, formatEuroShort, sanitizeAmountText } from '../data/money'
import { firstFreeColor } from '../data/format'
import { monthOf, todayISO } from '../data/dates'
import { Dialog } from '../components/Dialog'
import { CategoryRow } from '../components/CategoryRow'
import { ColorSwatchPicker, type ColorChoice } from '../components/ColorSwatchPicker'
import { categoryPaint } from '../data/colors'
import { TextField } from '../components/Field'
import { Gauge } from '../components/Gauge'
import { Text } from '../components/Text'
import { useIsMobile } from '../ui/useIsMobile'
import styles from './Dialogs.module.css'

interface NewCategoryDialogProps {
  onCreated?(categoryId: string): void
  onClose(): void
}

export function NewCategoryDialog({
  onCreated,
  onClose
}: NewCategoryDialogProps): React.JSX.Element {
  const isMobile = useIsMobile()
  const data = useBudj((s) => s.data)
  const addCategory = useBudj((s) => s.addCategory)
  const toast = useUi((s) => s.toast)

  const month = monthOf(todayISO())
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [color, setColor] = useState<ColorChoice>(() => ({
    color: firstFreeColor(data.categories.map((c) => c.color))
  }))

  const cents = amountTextToCents(budget)
  const trimmed = name.trim()
  const taken = trimmed !== '' && isCategoryNameTaken(data, trimmed)
  const monthBudget = sel.monthBudget(data, month)
  const allocated = sel.allocatedBudget(data, month) + cents
  const rest = monthBudget - allocated

  const submit = (): void => {
    if (!trimmed || taken) return
    const category = addCategory({ name: trimmed, ...color, monthlyBudget: cents })
    toast(`Catégorie « ${category.name} » créée`)
    onClose()
    onCreated?.(category.id)
  }

  return (
    <Dialog
      title="Nouvelle catégorie"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Créer la catégorie"
      submitIcon={isMobile ? 'add' : undefined}
      submitDisabled={!trimmed || taken}
    >
      <div className={styles.group}>
        <Text variant="label-medium" className={styles.groupLabelMuted}>
          Aperçu
        </Text>
        {isMobile ? (
          <div
            className={styles.categoryPreview}
            style={
              {
                '--preview-bg': categoryPaint(color).bg,
                '--preview-fg': categoryPaint(color).fg
              } as CSSProperties
            }
          >
            <div className={styles.previewLine}>
              <Text variant="h3" as="span">
                {trimmed || 'Nouvelle catégorie'}
              </Text>
              <Text variant="h3" as="span" tabular>
                {formatEuroShort(cents)}
              </Text>
            </div>
            <div className={`${styles.previewLine} ${styles.previewPlain}`}>
              <Text variant="label-regular" as="span">
                Budget alloué
              </Text>
              <Text variant="label-regular" as="span" tabular>
                {formatEuroShort(cents)}
              </Text>
            </div>
          </div>
        ) : (
          <CategoryRow
            color={categoryPaint(color)}
            name={trimmed || 'Nouvelle catégorie'}
            detail={`Budget de ${formatEuroShort(cents)}`}
            spentLabel={`${formatEuro(0)} dépensés · 0 %`}
            remaining={formatEuro(cents)}
            remainingLabel="restants"
            ratio={0}
            compact
          />
        )}
      </div>

      <div className={styles.row}>
        <TextField
          label="Nom de la catégorie"
          value={name}
          onChange={setName}
          placeholder="Ex. Voyages"
          maxLength={30}
          autoFocusOnOpen
          error={taken ? 'Une catégorie porte déjà ce nom.' : undefined}
        />
        <TextField
          label="Budget mensuel"
          value={budget}
          onChange={(v) => setBudget(sanitizeAmountText(v))}
          placeholder="0"
          inputMode="decimal"
          suffix="€"
          className="tabular"
        />
      </div>

      <div className={styles.allocation}>
        <div className={`t-label-regular ${styles.allocationHead}`}>
          <span>Budget réparti</span>
          <span className="tabular">
            <strong className="t-label-bold">{formatEuroShort(allocated)}</strong> /{' '}
            {formatEuroShort(monthBudget)}
          </span>
        </div>
        <Gauge
          ratio={monthBudget > 0 ? allocated / monthBudget : 1}
          fill={rest < 0 ? 'bg-danger' : 'bg-accent'}
          track={isMobile ? 'bg-brand-strong' : 'bg-brand-muted'}
        />
        <Text variant="label-regular" className={rest < 0 ? styles.warning : styles.note}>
          {rest > 0
            ? `Il te restera ${formatEuro(rest)} à répartir.`
            : rest === 0
              ? 'Tout ton budget est réparti avec cette catégorie.'
              : `Attention : tu répartis ${formatEuro(-rest)} de plus que ton budget mensuel.`}
        </Text>
      </div>

      <div className={styles.group}>
        <Text variant="label-medium" className={styles.groupLabel}>
          Couleur
        </Text>
        <ColorSwatchPicker value={color} onChange={setColor} />
      </div>
    </Dialog>
  )
}
