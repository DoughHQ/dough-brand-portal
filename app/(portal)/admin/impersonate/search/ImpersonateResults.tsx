import type { ImpersonateBrandHit } from './useImpersonateSearch'

export function ImpersonateResults({
  query,
  hits,
  searching,
  entering,
  pendingId,
  pick,
  currentImpersonatedBrandId,
}: {
  query: string
  hits: ImpersonateBrandHit[]
  searching: boolean
  entering: boolean
  pendingId: number | null
  pick: (brand: ImpersonateBrandHit) => Promise<void>
  currentImpersonatedBrandId: number | null
}) {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--ink-10)',
        borderRadius: 12,
        overflow: 'hidden',
        minHeight: 120,
      }}
    >
      {query.trim().length < 2 ? (
        <div style={{ padding: '28px 20px', fontSize: 13, color: 'var(--ink-30)', lineHeight: 1.5 }}>
          Type at least 2 characters to search.
        </div>
      ) : hits.length === 0 && searching ? (
        <div style={{ padding: '28px 20px', fontSize: 13, color: 'var(--ink-30)' }}>Searching…</div>
      ) : hits.length === 0 ? (
        <div style={{ padding: '28px 20px', fontSize: 13, color: 'var(--ink-30)' }}>
          No brands match “{query.trim()}”.
        </div>
      ) : (
        hits.map((brand, i) => {
          const active = currentImpersonatedBrandId === brand.brand_id
          const busy = entering && pendingId === brand.brand_id
          return (
            <button
              key={brand.brand_id}
              type="button"
              disabled={entering}
              onClick={() => void pick(brand)}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '14px 18px',
                border: 'none',
                borderTop: i === 0 ? 'none' : '1px solid var(--ink-10)',
                background: active ? 'var(--sage-pale, #eef5f0)' : 'transparent',
                cursor: entering ? 'wait' : 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--font-sans)',
                opacity: searching ? 0.85 : 1,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>
                  {brand.brand_name}
                  {active ? (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--sage)',
                      }}
                    >
                      Current
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-30)', marginTop: 3 }}>
                  {brand.product_count.toLocaleString()} products
                  {' · '}
                  {brand.battle_count.toLocaleString()} battles
                  {brand.top_elo != null ? ` · top Elo ${Math.round(brand.top_elo)}` : ''}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sage)', flexShrink: 0 }}>
                {busy ? 'Entering…' : active ? 'Re-enter →' : 'View as brand →'}
              </span>
            </button>
          )
        })
      )}
    </div>
  )
}
