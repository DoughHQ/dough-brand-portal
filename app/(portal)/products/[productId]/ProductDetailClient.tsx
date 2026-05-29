'use client'

import Link from 'next/link'
import type { PortalUser, ProductDetail, ProductBattleHistory } from '@/lib/queries'

interface Props {
  portalUser: PortalUser
  product: ProductDetail
  history: ProductBattleHistory[]
  isClaimed: boolean
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

function EloSparkline({ history }: { history: ProductBattleHistory[] }) {
  if (history.length < 2) return (
    <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>More battles needed for trend</div>
    </div>
  )

  const points = history.map((h) => ({
    date: h.battle_date,
    battles: h.battles,
    winRate: h.battles > 0 ? h.wins / h.battles : 0.5,
  }))

  const w = 400
  const h = 80
  const svgPoints = points.map((p, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - (p.winRate * (h - 16)) - 8,
  }))
  const line = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = line + ` L${w},${h} L0,${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
      style={{ width: '100%', height: 80, overflow: 'visible' }}>
      <defs>
        <linearGradient id="detail-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sage)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--sage)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#detail-fill)" />
      <path d={line} fill="none" stroke="var(--sage)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {svgPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--sage)" />
      ))}
    </svg>
  )
}

export default function ProductDetailClient({ portalUser, product, history, isClaimed }: Props) {
  const winRate = product.battles_total > 0
    ? Math.round((product.battles_won / product.battles_total) * 100)
    : null
  const avgDecisionMs = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.avg_decision_ms, 0) / history.length)
    : null

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1200, margin: '0 auto', padding: '36px 32px' }}>

      <Link href="/products" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: 'var(--ink-50)',
        marginBottom: 28,
        fontWeight: 400,
        textDecoration: 'none',
      }}>
        ← Products
      </Link>

      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-xl)',
        padding: '32px 36px',
        marginBottom: 20,
        display: 'grid',
        gridTemplateColumns: '96px 1fr auto',
        gap: 28,
        alignItems: 'start',
      }}>

        <div style={{
          width: 96,
          height: 96,
          borderRadius: 'var(--r-md)',
          background: 'var(--surface-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.product_name_clean}
              style={{ maxWidth: '88px', maxHeight: '88px', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink-30)' }}>
              {product.product_name_clean[0]}
            </span>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 8, letterSpacing: '0.02em' }}>
            {[product.l1_name, product.l2_name, product.l3_name].filter(Boolean).join(' · ')}
          </div>

          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            fontWeight: 400,
            color: 'var(--ink)',
            lineHeight: 1.2,
            marginBottom: 6,
          }}>
            {product.product_name_clean}
          </div>

          {product.product_flavor_variant && (
            <div style={{ fontSize: 13, color: 'var(--ink-50)', marginBottom: 6 }}>
              {product.product_flavor_variant}
            </div>
          )}

          <div style={{ fontSize: 12, color: 'var(--ink-50)', marginBottom: 16 }}>
            {product.brand_name}
            {product.price_tier_label && (
              <span style={{ marginLeft: 10, color: 'var(--ink-30)' }}>{product.price_tier_label}</span>
            )}
          </div>

          {isClaimed && product.battles_total > 0 ? (
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              fontWeight: 400,
              color: 'var(--ink)',
              lineHeight: 1.5,
              maxWidth: 500,
            }}>
              {product.battles_total} battles in {product.l3_name ?? product.l2_name}
              {' · '}{product.battles_won}W · {product.battles_lost}L
            </div>
          ) : isClaimed ? (
            <div style={{ fontSize: 13, color: 'var(--ink-30)', lineHeight: 1.5 }}>
              No battles recorded yet.
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--sage-pale)',
              border: '1px solid rgba(62,107,74,0.15)',
              borderRadius: 'var(--r-sm)',
              padding: '8px 14px',
            }}>
              <span style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500 }}>
                Unlock this SKU to view full intelligence
              </span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            ELO Score
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 48,
            fontWeight: 400,
            color: 'var(--ink)',
            lineHeight: 1,
            letterSpacing: '-1px',
          }}>
            {product.elo_score ? Math.round(product.elo_score) : '—'}
          </div>
          {product.last_battle_at && (
            <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 8 }}>
              Last active {relativeTime(product.last_battle_at)}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        {[
          {
            label: 'Win Rate',
            value: isClaimed && winRate !== null ? `${winRate}%` : '—',
            sub: isClaimed && product.battles_total > 0
              ? `${product.battles_won} wins · ${product.battles_lost} losses`
              : 'Unlock to view',
            locked: !isClaimed,
          },
          {
            label: 'Total Battles',
            value: product.battles_total > 0 ? product.battles_total.toString() : '—',
            sub: product.total_scans > 0 ? `${product.total_scans} scans` : 'No scans yet',
            locked: false,
          },
          {
            label: 'Decision Time',
            value: isClaimed && avgDecisionMs ? `${(avgDecisionMs / 1000).toFixed(1)}s` : '—',
            sub: isClaimed && avgDecisionMs ? 'avg per battle' : 'Unlock to view',
            locked: !isClaimed,
          },
          {
            label: 'Category',
            value: product.l2_name ?? '—',
            sub: product.l3_name ?? '',
            locked: false,
          },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--ink-50)', marginBottom: 6, fontWeight: 400 }}>
              {stat.label}
            </div>
            <div style={{
              fontFamily: stat.locked ? 'var(--font-sans)' : 'var(--font-serif)',
              fontSize: stat.locked ? 13 : 24,
              fontWeight: 400,
              color: stat.locked ? 'var(--ink-30)' : 'var(--ink)',
              marginBottom: 4,
              lineHeight: 1.1,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
              {stat.locked ? (
                <span style={{
                  background: 'var(--sage-pale)',
                  color: 'var(--sage)',
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 'var(--r-sm)',
                  fontWeight: 500,
                }}>
                  Unlock
                </span>
              ) : stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        marginBottom: 20,
      }}>
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          padding: '24px 24px 20px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', letterSpacing: '0.02em' }}>
              Battle activity
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
              {history.length} session{history.length !== 1 ? 's' : ''}
            </div>
          </div>
          <EloSparkline history={history} />
          {history.length >= 2 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--ink-30)' }}>{history[0]?.battle_date}</span>
              <span style={{ fontSize: 10, color: 'var(--ink-30)' }}>{history[history.length - 1]?.battle_date}</span>
            </div>
          )}
        </div>

        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          padding: '24px 24px 20px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 20, letterSpacing: '0.02em' }}>
            Battle log
          </div>
          {history.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 60px 60px 70px',
                padding: '0 0 8px',
                borderBottom: '1px solid var(--ink-10)',
                marginBottom: 4,
              }}>
                {['Date', 'Battles', 'Wins', 'Avg time'].map(h => (
                  <div key={h} style={{ fontSize: 10, color: 'var(--ink-30)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Date' ? 'left' : 'right' }}>
                    {h}
                  </div>
                ))}
              </div>
              {history.map((row, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 60px 70px',
                  padding: '10px 0',
                  borderBottom: i < history.length - 1 ? '1px solid var(--ink-10)' : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-50)' }}>{row.battle_date}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink)', textAlign: 'right', fontWeight: 500 }}>{row.battles}</div>
                  <div style={{ fontSize: 12, color: 'var(--sage)', textAlign: 'right', fontWeight: 500 }}>
                    {isClaimed ? row.wins : '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-50)', textAlign: 'right' }}>
                    {isClaimed ? `${(row.avg_decision_ms / 1000).toFixed(1)}s` : '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ink-30)', lineHeight: 1.6 }}>
              No battle sessions recorded yet.
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {[
          {
            label: 'Occasions',
            body: 'Purchase occasion data populates after 50+ battles across multiple users.',
          },
          {
            label: 'Audience',
            body: 'Demographic affinity data requires user profile signals. Building as the platform grows.',
          },
          {
            label: 'Health & Sustainability',
            body: 'Nutritional scoring, PROOFE ethics ratings, and price-value analysis. Coming in a future update.',
          },
        ].map(section => (
          <div key={section.label} style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-lg)',
            padding: '24px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>
              {section.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-30)', lineHeight: 1.65 }}>
              {section.body}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
