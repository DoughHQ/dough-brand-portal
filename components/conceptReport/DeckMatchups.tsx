import type { ConceptMissionReport } from '@/lib/conceptReport/types'
import { battleIntentLabel } from '@/lib/conceptReport/copy'
import { CombatantPortrait } from './CombatantPortrait'
import { DECK_WIDTH } from './conceptDeckShared'

export function DeckMatchups({ report }: { report: ConceptMissionReport }) {
  const record = report.top_pair_record
  if (!record || record.vs.length === 0) return null

  const topName = record.display_name || report.finding.top.display_name
  const topIntent = String(record.battle_intent || report.finding.top.battle_intent || '')
  const topRow = report.win_rate_field.find((r) => r.combatant_ref === record.combatant_ref)

  return (
    <section style={{ maxWidth: DECK_WIDTH, margin: '0 auto', padding: '48px 28px' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
          color: 'var(--ink)',
        }}
      >
        Why it played that way
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--ink-muted)',
          margin: '0 0 28px',
          maxWidth: 520,
          lineHeight: 1.5,
        }}
      >
        Real head-to-head choices for {topName} against each opponent in this field.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {record.vs.map((m) => {
          const total = m.top_wins + m.opponent_wins
          const winPct = total > 0 ? (m.top_wins / total) * 100 : 50
          const oppIntent = String(m.opponent_intent || 'direct_competitor')
          return (
            <div
              key={m.opponent_ref}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 16,
                alignItems: 'center',
                padding: '18px 20px',
                background: 'var(--paper)',
                border: '1px solid var(--mist)',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <CombatantPortrait
                  name={topName}
                  battleIntent={topIntent}
                  imageUrl={topRow?.image_url}
                  size={48}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{topName}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    won {m.top_wins}–{m.opponent_wins}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 100 }}>
                <div
                  style={{
                    height: 8,
                    width: 100,
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    background: 'var(--surface-1)',
                    margin: '0 auto 6px',
                  }}
                >
                  <div style={{ width: `${winPct}%`, background: 'var(--sage)' }} />
                  <div style={{ flex: 1, background: 'var(--mist)' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{m.shown} shown</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minWidth: 0,
                  justifyContent: 'flex-end',
                  textAlign: 'right',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                    {m.opponent_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    {battleIntentLabel(oppIntent)}
                  </div>
                </div>
                <CombatantPortrait
                  name={m.opponent_name}
                  battleIntent={oppIntent}
                  size={48}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
