// Logic of the 3-step onboarding (v3 §7.1), shared by Playfull and Pro.
import { useState } from 'react'
import type { CategoryColor } from '../shared/types'
import { amountTextToCents, formatEuroShort } from '../data/money'
import * as sel from '../data/selectors'
import { useBudj } from '../data/store'
import { useInstallMode } from '../platform/install'

export interface OnboardingCategory {
  name: string
  color: CategoryColor
  selected: boolean
  /** Typed amount; empty = the suggestion is used. */
  amount: string
}

/** Courses, Restaurant and Sorties are ticked by default (Figma 01 · Onboarding). */
const DEFAULT_SELECTED = new Set(['Courses', 'Restaurant', 'Sorties'])

export function useOnboarding() {
  const completeOnboarding = useBudj((s) => s.completeOnboarding)
  // In a browser tab, the install help comes first: data typed in Safari would
  // not be in the installed app (decided once, so the steps do not shift).
  const installMode = useInstallMode()
  const [needsInstall] = useState(installMode === 'ios' || installMode === 'prompt')
  const [step, setStep] = useState(needsInstall ? 0 : 1)
  const [firstName, setFirstName] = useState('')
  const [budget, setBudget] = useState('')
  const [savings, setSavings] = useState('')
  const [skippedSavings, setSkippedSavings] = useState(false)
  const [categories, setCategories] = useState<OnboardingCategory[]>(
    sel.SUGGESTED_CATEGORIES.map((c) => ({
      name: c.name,
      color: c.color,
      selected: DEFAULT_SELECTED.has(c.name),
      amount: ''
    }))
  )

  const budgetCents = amountTextToCents(budget)
  const typedSavings = savings === '' ? undefined : amountTextToCents(savings)
  const suggestions = sel.onboardingSuggestions(budgetCents, skippedSavings ? 0 : typedSavings)
  const savingsCents = skippedSavings ? 0 : (typedSavings ?? suggestions.savings)
  const amountOf = (c: OnboardingCategory): number =>
    c.amount === '' ? (suggestions.categories[c.name] ?? 0) : amountTextToCents(c.amount)
  const selected = categories.filter((c) => c.selected)
  const allocated = selected.reduce((a, c) => a + amountOf(c), 0)
  const free = budgetCents - savingsCents - allocated

  const update = (name: string, patch: Partial<OnboardingCategory>): void =>
    setCategories((list) => list.map((c) => (c.name === name ? { ...c, ...patch } : c)))

  const finish = (): void => {
    completeOnboarding({
      firstName,
      monthlyBudget: budgetCents,
      savingsGoal: savingsCents,
      categories: selected.map((c) => ({ name: c.name, color: c.color, monthlyBudget: amountOf(c) }))
    })
  }

  return {
    step,
    stepCount: 3,
    needsInstall,
    firstName,
    setFirstName,
    budget,
    setBudget,
    budgetCents,
    savings,
    setSavings: (value: string) => {
      setSkippedSavings(false)
      setSavings(value)
    },
    savingsSuggestion: suggestions.savings,
    categories,
    suggestionOf: (name: string) => suggestions.categories[name] ?? 0,
    summary: {
      count: selected.length,
      text: `${selected.length} catégorie${selected.length > 1 ? 's' : ''} · ${formatEuroShort(allocated)} répartis`,
      free: free >= 0 ? `${formatEuroShort(free)} libres` : `${formatEuroShort(-free)} de trop`,
      over: free < 0
    },
    canContinue: step === 2 ? budgetCents > 0 : true,
    actions: {
      next: () => (step >= 3 ? finish() : setStep(step + 1)),
      back: () => setStep(Math.max(needsInstall ? 0 : 1, step - 1)),
      skipSavings: () => {
        setSkippedSavings(true)
        setSavings('')
        setStep(3)
      },
      toggle: (name: string) => update(name, { selected: !categories.find((c) => c.name === name)?.selected }),
      setAmount: (name: string, amount: string) => update(name, { amount, selected: true })
    }
  }
}
