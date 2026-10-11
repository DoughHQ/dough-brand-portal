import type { WinRateFieldRow } from '@/lib/conceptReport/types'
import {
  battleIntentLabel,
  formatPrice,
  isOwnConceptIntent,
} from '@/lib/conceptReport/copy'
import { CombatantPortrait } from './CombatantPortrait'
import { Chip, DECK_WIDTH } from './conceptDeckShared'

export function DeckFieldCast({ field }: { field: WinRateFieldRow[] }) {
  return (
    <section
      style={{
        borderTop: '1px solid var(--mist)',
        borderBottom: '1px solid var(--mist)',
        background: 'rgba(255,253,248,0.7)',
        padding: '36px 0 40px',
      }}
    >
      <div style={{ maxWidth: DECK_WIDTH, margin: '0 auto', padding: '0 28px' }}>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            margin: '0 0 20px',
          }}
        >
          The field
        </p>
        <div
          style={{
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            paddingBottom: 8,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {field.map((row) => {
            const own = isOwnConceptIntent(String(row.battle_intent))
            const price = formatPrice(row.frozen_price)
            return (
              <div
                key={row.combatant_ref}
                style={{
                  flex: '0 0 auto',
                  width: 140,
                  padding: 12,
                  borderRadius: 10,
                  background: own ? 'var(--bg-pro)' : 'transparent',
                }}
              >
                <CombatantPortrait
                  name={row.display_name}
                  battleIntent={String(row.battle_intent)}
                  imageUrl={row.image_url}
                  size={72}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginTop: 12,
                    lineHeight: 1.3,
                  }}
                >
                  {row.display_name}
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Chip tone={own ? 'pro' : 'neutral'}>
                    {battleIntentLabel(String(row.battle_intent))}
                  </Chip>
                  {price ? (
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{price}</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
