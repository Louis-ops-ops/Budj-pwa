import { useNavigate } from 'react-router'
import { formatDayMonth, formatRelative, todayISO } from '../../../data/dates'
import { formatEuro, formatEuroFloor } from '../../../data/money'
import * as sel from '../../../data/selectors'
import { useBudj } from '../../../data/store'
import { useUi } from '../../../ui/uiStore'
import { Avatar } from '../../../components/Avatar'
import { FixedExpenses as PlayfullFixedExpenses } from '../../../screens/FixedExpenses'
import { WeekCard } from '../../../screens/FixedExpensesMobile'
import { Text } from '../../../components/Text'
import { ActionRow, FormRow, Row } from '../../shared/List'
import { ProCard, ProHero } from '../components/ProBlocks'
import { ProPage, ProSection } from '../components/ProPage'
import { TabTopBar } from '../components/ProTopBar'

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`

/**
 * Figma: UI - Pro › 06 · Dépenses fixes (384:12455). The month calendar keeps
 * the shared screen for now (pushed from « Mois entier »).
 */
export function FixedExpenses({ calendar }: { calendar?: boolean }): React.JSX.Element {
  if (calendar) return <PlayfullFixedExpenses calendar />
  return <FixedList />
}

function FixedList(): React.JSX.Element {
  const data = useBudj((s) => s.data)
  const openDialog = useUi((s) => s.openDialog)
  const navigate = useNavigate()
  const today = todayISO()
  const month = sel.currentMonth(data, today)
  const status = sel.fixedStatus(data, month, today)
  const groups = sel.fixedGroups(data, month)
  const next = sel.upcomingCharges(data, today, 1)[0]

  return (
    <ProPage hero="fixed" label="Dépenses fixes">
      <TabTopBar
        month={month}
        action={{ icon: 'add', label: 'Nouvelle dépense fixe', onClick: () => openDialog({ kind: 'fixed' }) }}
      />
      <ProHero
        label="Dépenses fixes chaque mois"
        cents={status.total}
        sub={plural(status.count, 'prélèvement', 'prélèvements')}
      />
      <ProSection>
        <ProCard label="Résumé">
          <FormRow label="Prélevé" value={formatEuro(status.paid)} />
          <FormRow label="À venir" value={formatEuro(status.upcoming)} tone="brand" />
        </ProCard>

        <WeekCard days={sel.weekCharges(data, today)} today={today} onMonth={() => navigate('/fixes/calendrier')} />

        {next && (
          <ProCard title="Prochain prélèvement">
            <Row
              leading={<Avatar color="bleu" initial={next.fixed.label} />}
              title={next.fixed.label}
              subtitle={`${formatRelative(today, next.date)} · le ${formatDayMonth(next.date)}`}
              trailing={`−${formatEuro(next.fixed.amount)}`}
              onClick={() => openDialog({ kind: 'fixed', fixed: next.fixed })}
            />
          </ProCard>
        )}

        {groups.map((g) => (
          <ProCard
            key={g.subcategory.id}
            title={g.subcategory.name}
            count={`${plural(g.items.length, 'prélèvement', 'prélèvements')} · ${formatEuroFloor(g.total)}`}
          >
            {g.items.map((f) => {
              const charge = sel.fixedChargeStatus(data, f, today)
              return (
                <Row
                  key={f.id}
                  leading={<Avatar color="bleu" initial={f.label} />}
                  title={f.label}
                  subtitle={`Le ${f.dayOfMonth === 1 ? '1er' : f.dayOfMonth} du mois`}
                  trailing={formatEuro(f.amount)}
                  trailingSub={
                    charge.status === 'paid' ? (
                      'Prélevé'
                    ) : (
                      <Text variant="label-regular" color="brand" as="span">
                        À venir
                      </Text>
                    )
                  }
                  onClick={() => openDialog({ kind: 'fixed', fixed: f })}
                />
              )
            })}
          </ProCard>
        ))}

        {groups.length === 0 && (
          <ProCard label="Aucune dépense fixe">
            <ActionRow icon="add" label="Ajouter ton loyer, tes abonnements…" onClick={() => openDialog({ kind: 'fixed' })} />
          </ProCard>
        )}
      </ProSection>
    </ProPage>
  )
}
