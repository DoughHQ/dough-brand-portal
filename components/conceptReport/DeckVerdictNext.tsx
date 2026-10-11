import type { ConceptMissionReport } from '@/lib/conceptReport/types'
import {
  battleIntentLabel,
  buildConfidentVerdictLine,
  buildProvisionalVerdictLine,
  isConfidentVerdict,
  isOwnConceptIntent,
} from '@/lib/conceptReport/copy'
import { CombatantPortrait } from './CombatantPortrait'
import { Chip, DECK_WIDTH } from './conceptDeckShared'

export function DeckVerdictNext({
  report,
  thin,
}: {
  report: ConceptMissionReport
  thin: boolean
}) {
  const confident = isConfidentVerdict(report.decision_frame, thin)
  const top = report.finding.top
  const rate = top.win_rate_of_100
  const topRow =
    report.win_rate_field.find((r) => r.combatant_ref === top.combatant_ref) ??
    report.win_rate_field.find((r) => r.display_name === top.display_name) ??
    report.win_rate_field[0]
  const topIntent = String(top.battle_intent || topRow?.battle_intent || '')
  const topOwn = isOwnConceptIntent(topIntent)
  const verdictLine = confident
    ? buildConfidentVerdictLine(report.finding)
    : buildProvisionalVerdictLine(report.finding)
  const frame = report.decision_frame

  return (
    <section
      style={{
        maxWidth: DECK_WIDTH,
        margin: '0 auto',
        padding: '48px 28px 40px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)',
          gap: 40,
          alignItems: 'start',
        }}
        className="deck-verdict-grid"
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              margin: '0 0 16px',
            }}
          >
            {confident ? 'The finding' : 'Provisional read'}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 18,
              alignItems: 'flex-start',
              marginBottom: 20,
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <CombatantPortrait
                name={top.display_name}
                battleIntent={topIntent}
                imageUrl={topRow?.image_url}
                size={148}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 8,
                  top: 8,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: confident ? 'var(--sage-dark)' : 'var(--ink-muted)',
                  color: 'var(--on-fill, #fff)',
                  padding: '3px 7px',
                  borderRadius: 4,
                }}
              >
                Winner
              </span>
            </div>
            <div style={{ minWidth: 0, paddingTop: 4 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 4vw, 36px)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  color: 'var(--ink)',
                  margin: '0 0 8px',
                }}
              >
                {top.display_name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                <Chip tone={topOwn ? 'pro' : 'neutral'}>{battleIntentLabel(topIntent)}</Chip>
              </div>
              <div
                className="deck-enter-verdict"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(48px, 7vw, 72px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.04em',
                  color: confident ? 'var(--heading)' : 'var(--ink-muted)',
                }}
              >
                {rate != null ? Math.round(rate) : '—'}
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--ink-muted)',
                    marginLeft: 8,
                    letterSpacing: 0,
                  }}
                >
                  of 100
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--ink-faint)',
                  margin: '8px 0 0',
                }}
              >
                wins out of 100 head-to-heads in this field
              </p>
            </div>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: confident ? 22 : 18,
              lineHeight: 1.35,
              color: confident ? 'var(--ink)' : 'var(--ink-muted)',
              margin: '0 0 14px',
              maxWidth: 420,
            }}
          >
            {verdictLine}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--ink-muted)',
              margin: 0,
              maxWidth: 400,
            }}
          >
            The ranking comes only from forced choices between real options. You chose who
            competed; respondents chose who won — no question wording can tip it.
          </p>
        </div>

        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--mist)',
            borderRadius: 10,
            padding: '28px 28px 24px',
            boxShadow: '0 1px 0 rgba(28, 38, 32, 0.04)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              margin: '0 0 12px',
            }}
          >
            What to do next
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--heading)',
              margin: '0 0 14px',
            }}
          >
            {frame.action}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--ink)',
              margin: '0 0 18px',
            }}
          >
            {frame.rationale}
          </p>
          {report.finding.note ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--ink-muted)',
                margin: 0,
                paddingTop: 14,
                borderTop: '1px solid var(--mist)',
              }}
            >
              {report.finding.note}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
