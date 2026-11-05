import { useEffect, useState, type CSSProperties } from 'react'
import { CATEGORY_COLORS, type CategoryColor } from '../shared/types'
import { platform } from '../platform/storage'
import { changeTheme, resolveTheme } from '../platform/theme'
import { InstallHelp } from '../components/InstallHelp'
import { useBudj } from '../data/store'
import { amountTextToCents, formatEuro, sanitizeAmountText } from '../data/money'
import { AmountInput } from '../components/AmountInput'
import { Button } from '../components/Button'
import { IconButton } from '../components/IconButton'
import { Text } from '../components/Text'
import { TextLink } from '../components/TextLink'
import { ThemePicker, type ThemeChoice } from '../components/ThemePicker'
import styles from './Onboarding.module.css'

interface FixedLine {
  key: number
  label: string
  amount: string
  day: number
}

interface CategoryLine {
  key: number
  name: string
  budget: string
  color: CategoryColor
}

const COLOR_NAMES: Record<CategoryColor, string> = {
  vert: 'vert',
  mauve: 'mauve',
  orange: 'orange',
  rouge: 'rouge',
  cyan: 'cyan'
}

let lineKey = 1
const newFixed = (): FixedLine => ({ key: lineKey++, label: '', amount: '', day: 1 })

const SUGGESTED: [string, CategoryColor][] = [
  ['Courses', 'vert'],
  ['Restaurants', 'mauve'],
  ['Sorties', 'cyan'],
  ['Shopping', 'orange'],
  ['Santé', 'rouge']
]

export function Onboarding(): React.JSX.Element {
  const completeOnboarding = useBudj((s) => s.completeOnboarding)
  const [step, setStep] = useState(1)
  const [theme, setTheme] = useState<ThemeChoice>('light')

  useEffect(() => {
    void platform.getTheme().then((t) => setTheme(resolveTheme(t)))
  }, [])

  // Applied right away so the whole setup already uses the chosen theme.
  const chooseTheme = (value: ThemeChoice): void => {
    setTheme(value)
    changeTheme(value)
  }
  const [budget, setBudget] = useState('')
  const [fixed, setFixed] = useState<FixedLine[]>([newFixed()])
  const [categories, setCategories] = useState<CategoryLine[]>(
    SUGGESTED.map(([name, color]) => ({ key: lineKey++, name, budget: '', color }))
  )

  const budgetCents = amountTextToCents(budget)
  const validFixed = fixed.filter((f) => f.label.trim() !== '' && amountTextToCents(f.amount) > 0)
  const fixedTotal = validFixed.reduce((a, f) => a + amountTextToCents(f.amount), 0)
  const categoriesTotal = categories.reduce((a, c) => a + amountTextToCents(c.budget), 0)
  const rest = budgetCents - fixedTotal - categoriesTotal

  const names = categories.map((c) => c.name.trim().toLocaleLowerCase('fr-FR'))
  const duplicate = (c: CategoryLine): boolean => {
    const key = c.name.trim().toLocaleLowerCase('fr-FR')
    return key !== '' && names.filter((n) => n === key).length > 1
  }
  const hasDuplicates = categories.some(duplicate)

  const finish = (): void => {
    completeOnboarding({
      monthlyBudget: budgetCents,
      fixedExpenses: validFixed.map((f) => ({
        label: f.label.trim(),
        amount: amountTextToCents(f.amount),
        dayOfMonth: f.day
      })),
      categories: categories
        .filter((c) => c.name.trim() !== '')
        .map((c) => ({
          name: c.name.trim(),
          color: c.color,
          monthlyBudget: amountTextToCents(c.budget)
        }))
    })
  }

  const updateFixed = (key: number, patch: Partial<FixedLine>): void =>
    setFixed((lines) => lines.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const updateCategory = (key: number, patch: Partial<CategoryLine>): void =>
    setCategories((lines) => lines.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const titles: Record<number, [string, string]> = {
    1: ['Ton thème', 'Choisis l’apparence de Budj. Tu pourras la changer dans les Réglages.'],
    2: ['Ton budget mensuel', 'Tout ce que tu peux dépenser ce mois-ci, dépenses fixes comprises.'],
    3: [
      'Tes dépenses fixes',
      'Loyer, abonnements, factures : ce qui part chaque mois. Tu pourras en ajouter plus tard.'
    ],
    4: [
      'Tes catégories',
      'Répartis ton budget. Tu peux renommer, retirer ou ajouter des catégories.'
    ]
  }

  return (
    <div className={styles.screen}>
      <form
        className={styles.card}
        onSubmit={(e) => {
          e.preventDefault()
          if (step === 1) setStep(2)
          else if (step === 2 && budgetCents > 0) setStep(3)
          else if (step === 3) setStep(4)
          else if (step === 4 && !hasDuplicates) finish()
        }}
        noValidate
      >
        <div className={styles.top}>
          <Text variant="h1" as="span" className={styles.brand}>
            Budj
          </Text>
          <div className={styles.steps}>
            <div className={styles.dots} aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={[styles.dot, n <= step ? styles.dotActive : ''].join(' ')}
                />
              ))}
            </div>
            <Text variant="label-medium" as="span">
              {step} sur 4
            </Text>
          </div>
        </div>

        <div className={styles.titles}>
          <Text variant="h1" as="h1">
            {titles[step][0]}
          </Text>
          <Text variant="body-regular" color="tertiary">
            {titles[step][1]}
          </Text>
        </div>

        {step === 1 && (
          <div className={styles.body}>
            <ThemePicker value={theme} onChange={chooseTheme} />
            <InstallHelp />
          </div>
        )}

        {step === 2 && (
          <div className={styles.body}>
            <AmountInput
              value={budget}
              onChange={setBudget}
              label="Budget mensuel"
              autoFocus
              key="budget"
            />
            <Text variant="label-regular" className={styles.help}>
              Par exemple 1 900 €. Tu pourras le modifier à tout moment.
            </Text>
          </div>
        )}

        {step === 3 && (
          <div className={styles.body}>
            <div className={`t-label-medium ${styles.headRow}`} aria-hidden="true">
              <span className={styles.colGrow}>Libellé</span>
              <span className={styles.colAmount}>Montant</span>
              <span className={styles.colDay}>Jour</span>
              <span className={styles.colAction} />
            </div>
            {fixed.map((line, i) => (
              <div key={line.key} className={styles.line}>
                <div className={`${styles.box} ${styles.colGrow}`}>
                  <input
                    className={styles.input}
                    value={line.label}
                    placeholder="Ex. Loyer"
                    aria-label={`Libellé de la dépense fixe ${i + 1}`}
                    maxLength={40}
                    autoFocus={i === fixed.length - 1}
                    onChange={(e) => updateFixed(line.key, { label: e.target.value })}
                  />
                </div>
                <div className={`${styles.box} ${styles.colAmount}`}>
                  <input
                    className={`${styles.input} tabular`}
                    value={line.amount}
                    placeholder="0"
                    inputMode="decimal"
                    aria-label={`Montant de la dépense fixe ${i + 1}`}
                    onChange={(e) =>
                      updateFixed(line.key, { amount: sanitizeAmountText(e.target.value) })
                    }
                  />
                  <span className={styles.suffix}>€</span>
                </div>
                <div className={`${styles.box} ${styles.colDay}`}>
                  <select
                    className={`${styles.input} ${styles.select}`}
                    value={line.day}
                    aria-label={`Jour de prélèvement de la dépense fixe ${i + 1}`}
                    onChange={(e) => updateFixed(line.key, { day: Number(e.target.value) })}
                  >
                    {Array.from({ length: 31 }, (_, d) => d + 1).map((d) => (
                      <option key={d} value={d}>
                        Le {d}
                      </option>
                    ))}
                  </select>
                </div>
                <span className={styles.colAction}>
                  {fixed.length > 1 && (
                    <IconButton
                      icon="delete"
                      tone="danger"
                      label={`Retirer ${line.label || `la ligne ${i + 1}`}`}
                      onClick={() => setFixed((lines) => lines.filter((l) => l.key !== line.key))}
                    />
                  )}
                </span>
              </div>
            ))}
            <TextLink
              label="Ajouter une ligne"
              icon="add"
              onClick={() => setFixed((l) => [...l, newFixed()])}
            />
            {fixedTotal > 0 && (
              <div className={styles.summary}>
                <Text variant="label-medium" as="span">
                  Total des dépenses fixes
                </Text>
                <Text variant="label-bold" as="span" tabular>
                  {formatEuro(fixedTotal)} par mois
                </Text>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className={styles.body}>
            <div className={`t-label-medium ${styles.headRow}`} aria-hidden="true">
              <span className={styles.colColor} />
              <span className={styles.colGrow}>Catégorie</span>
              <span className={styles.colAmount}>Budget</span>
              <span className={styles.colAction} />
            </div>
            {categories.map((line, i) => {
              const swatch = {
                '--swatch-bg': `var(--category-${line.color}-bg)`,
                '--swatch-fg': `var(--category-${line.color}-fg)`
              } as CSSProperties
              const nextColor =
                CATEGORY_COLORS[(CATEGORY_COLORS.indexOf(line.color) + 1) % CATEGORY_COLORS.length]
              return (
                <div key={line.key} className={styles.line}>
                  <button
                    type="button"
                    className={`${styles.colorButton} ${styles.colColor}`}
                    style={swatch}
                    aria-label={`Couleur ${COLOR_NAMES[line.color]}, changer pour ${COLOR_NAMES[nextColor]}`}
                    title="Changer la couleur"
                    onClick={() => updateCategory(line.key, { color: nextColor })}
                  >
                    <span className={styles.colorDot} />
                  </button>
                  <div
                    className={[
                      styles.box,
                      styles.colGrow,
                      duplicate(line) ? styles.boxInvalid : ''
                    ].join(' ')}
                  >
                    <input
                      className={styles.input}
                      value={line.name}
                      placeholder="Nom de la catégorie"
                      aria-label={`Nom de la catégorie ${i + 1}`}
                      aria-invalid={duplicate(line) || undefined}
                      maxLength={30}
                      onChange={(e) => updateCategory(line.key, { name: e.target.value })}
                    />
                  </div>
                  <div className={`${styles.box} ${styles.colAmount}`}>
                    <input
                      className={`${styles.input} tabular`}
                      value={line.budget}
                      placeholder="0"
                      inputMode="decimal"
                      aria-label={`Budget de ${line.name || `la catégorie ${i + 1}`}`}
                      autoFocus={i === 0}
                      onChange={(e) =>
                        updateCategory(line.key, { budget: sanitizeAmountText(e.target.value) })
                      }
                    />
                    <span className={styles.suffix}>€</span>
                  </div>
                  <span className={styles.colAction}>
                    <IconButton
                      icon="delete"
                      tone="danger"
                      label={`Retirer ${line.name || `la catégorie ${i + 1}`}`}
                      onClick={() =>
                        setCategories((lines) => lines.filter((l) => l.key !== line.key))
                      }
                    />
                  </span>
                </div>
              )
            })}
            {hasDuplicates && (
              <Text variant="label-regular" className={styles.error}>
                Deux catégories ont le même nom.
              </Text>
            )}
            <TextLink
              label="Ajouter une catégorie"
              icon="add"
              onClick={() =>
                setCategories((lines) => [
                  ...lines,
                  {
                    key: lineKey++,
                    name: '',
                    budget: '',
                    color: CATEGORY_COLORS[lines.length % CATEGORY_COLORS.length]
                  }
                ])
              }
            />
            <div
              className={[styles.summary, rest < 0 ? styles.summaryNegative : ''].join(' ')}
              aria-live="polite"
            >
              <Text variant="label-medium" as="span">
                {rest >= 0 ? 'Reste à répartir' : 'Réparti au-delà du budget'}
              </Text>
              <Text variant="label-bold" as="span" tabular>
                {formatEuro(Math.abs(rest))}
              </Text>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          {step > 1 && <TextLink label="Retour" onClick={() => setStep(step - 1)} />}
          <div className={styles.footerButtons}>
            {step === 3 && (
              <Button
                label="Passer"
                variant="secondary"
                onClick={() => {
                  setFixed([newFixed()])
                  setStep(4)
                }}
              />
            )}
            {step < 4 ? (
              <Button label="Continuer" type="submit" disabled={step === 2 && budgetCents <= 0} />
            ) : (
              <Button label="Commencer" type="submit" disabled={hasDuplicates} />
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
