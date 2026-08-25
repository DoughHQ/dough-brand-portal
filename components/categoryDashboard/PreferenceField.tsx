import FieldPlot from '@/components/categoryDashboard/FieldPlot'
import UnboundWell from '@/components/categoryDashboard/UnboundWell'
import type { CategoryReport, RankingComponent } from '@/lib/categoryReport/types'

/**
 * Preference ranking on paper — the Salty Snacks Module 1 composition.
 * Page is cream; this sits as white paper with quiet section label.
 */
export default function PreferenceField({
  components,
  undefeated,
  winless,
  admin,
  eloTransform,
  separatedKicker,
}: {
  components: RankingComponent[]
  undefeated: NonNullable<CategoryReport['ranking']>['undefeated']
  winless: NonNullable<CategoryReport['ranking']>['winless']
  admin: boolean
  eloTransform: string | null
  separatedKicker: string | null
}) {
  return (
    <section
      aria-label="Preference ranking"
      style={{
        background: 'var(--paper, #fff)',
        borderRadius: 4,
        padding: '28px 32px 24px',
        marginBottom: 40,
        boxShadow: '0 0 0 1px var(--mist)',
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-30)',
            marginBottom: 6,
          }}
        >
          Category preference
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            fontWeight: 400,
            color: 'var(--ink)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Preference ranking
        </h2>
      </div>
      {components.map((c, i) => (
        <FieldPlot
          key={String(c.component_id)}
          component={c}
          index={i}
          total={components.length}
          admin={admin}
          eloTransform={eloTransform}
          showTransform={admin && i === 0}
        />
      ))}
      <UnboundWell
        undefeated={undefeated}
        winless={winless}
        admin={admin}
        kicker={separatedKicker}
      />
    </section>
  )
}
