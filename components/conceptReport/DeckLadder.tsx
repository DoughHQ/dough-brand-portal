import type { WinRateFieldRow } from '@/lib/conceptReport/types'
import {
  battleIntentLabel,
  formatPrice,
  isOwnConceptIntent,
} from '@/lib/conceptReport/copy'
import { CombatantPortrait } from './CombatantPortrait'
import { WinRateTrack } from './WinRateTrack'
import { Chip, DECK_WIDTH } from './conceptDeckShared'

export function DeckLadder({ field, thin }: { field: WinRateFieldRow[]; thin: boolean }) {
  return (
    <section
      className="deck-enter-ladder"
      style={{
        maxWidth: DECK_WIDTH,
        margin: '0 auto',
        padding: '40px 28px 48px',
        borderTop: '1px solid var(--mist)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }}
      >
        How often each one wins
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-muted)',
          margin: '0 0 28px',
          maxWidth: 560,
          lineHeight: 1.5,
        }}
      >
        {thin
          ? 'Point estimates only — no reliable ranges yet. Treat the order as directional.'
          : 'Out of 100 forced choices against a random opponent in this field. The shaded band is the range we’re confident the true number falls in.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {field.map((row) => {
          const own = isOwnConceptIntent(String(row.battle_intent))
          const price = formatPrice(row.frozen_price)
          return (
            <div
              key={row.combatant_ref}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 18,
                alignItems: 'start',
                padding: own ? 16 : 0,
                margin: own ? '0 -16px' : 0,
                background: own ? 'var(--bg-pro)' : 'transparent',
                borderRadius: own ? 10 : 0,
              }}
            >
              <CombatantPortrait
                name={row.display_name}
                battleIntent={String(row.battle_intent)}
                imageUrl={row.image_url}
                size={56}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>
                  {row.display_name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                  <Chip tone={own ? 'pro' : 'neutral'}>
                    {battleIntentLabel(String(row.battle_intent))}
                  </Chip>
                  {price ? <Chip>{price}</Chip> : null}
                </div>
                <WinRateTrack row={row} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 36,
                    lineHeight: 1,
                    color: own ? 'var(--text-pro)' : 'var(--ink)',
                  }}
                >
                  {row.win_rate_of_100 != null ? Math.round(row.win_rate_of_100) : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>of 100</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
