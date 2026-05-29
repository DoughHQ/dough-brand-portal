'use client'
import { useState, useEffect, useRef } from 'react'
import type { BrandSnapshot, ProductIntelligence, CompetitiveSnapshot, PortalUser, Brand, BrandSubscription } from '@/lib/queries'

type Period = '7d' | '30d' | '90d' | 'all'
type Props = {
  portalUser: PortalUser
  brand: Brand
  subscription: BrandSubscription | null
  snapshot: BrandSnapshot | null
  history: { snapshot_date: string; weighted_elo_score: number }[]
  productIntelligence: ProductIntelligence[]
  competitive: CompetitiveSnapshot | null
  allProducts: { product_id: number; product_name_display: string; total_battles: number }[]
  narrative: { headline: string; sub: string }
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return Math.round(n).toLocaleString()
}
function pct(n: number | null | undefined): string {
  if (n == null) return '—'
  return Math.round(n * 100) + '%'
}
function delta(n: number | null | undefined): string {
  if (n == null) return '—'
  const r = Math.round(n)
  return r > 0 ? `+${r}` : `${r}`
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    const start = prev.current
    const startTime = performance.now()
    function update(now: number) {
      const progress = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + (target - start) * ease))
      if (progress < 1) requestAnimationFrame(update)
      else prev.current = target
    }
    requestAnimationFrame(update)
  }, [target, duration])
  return value
}

function Sparkline({ data }: { data: { snapshot_date: string; weighted_elo_score: number }[] }) {
  if (!data.length) return null
  const scores = data.map(d => d.weighted_elo_score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1
  const w = 280, h = 90
  const points = scores.map((s, i) => ({
    x: (i / (scores.length - 1)) * w,
    y: h - ((s - min) / range) * (h - 16) - 8,
  }))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = line + ` L${w},${h} L0,${h} Z`
  const last = points[points.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width:'100%', height:'100%', overflow:'visible' }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sage)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--sage)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={h*0.25} x2={w} y2={h*0.25} stroke="var(--ink-10)" strokeWidth="1" />
      <line x1="0" y1={h*0.5} x2={w} y2={h*0.5} stroke="var(--ink-10)" strokeWidth="1" />
      <line x1="0" y1={h*0.75} x2={w} y2={h*0.75} stroke="var(--ink-10)" strokeWidth="1" />
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke="var(--sage)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {last && <>
        <circle cx={last.x} cy={last.y} r="3.5" fill="var(--sage)" />
        <circle cx={last.x} cy={last.y} r="7" fill="var(--sage)" fillOpacity="0.2" />
      </>}
    </svg>
  )
}

export default function DashboardClient({ portalUser, brand, subscription, snapshot, history, productIntelligence, competitive, allProducts, narrative }: Props) {
  const [period, setPeriod] = useState<Period>('30d')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const elo = useCountUp(Math.round(snapshot?.weighted_elo_score ?? 1000))
  const battles = useCountUp(snapshot?.total_battles_all_time ?? 0, 1000)
  const periodData = {
    '7d':  { delta: snapshot?.elo_velocity_7d ?? 0,  battles: snapshot?.total_battles_7d ?? 0 },
    '30d': { delta: snapshot?.elo_velocity_30d ?? 0, battles: snapshot?.total_battles_30d ?? 0 },
    '90d': { delta: (snapshot?.elo_velocity_30d ?? 0) * 3, battles: snapshot?.total_battles_30d ?? 0 },
    'all': { delta: (snapshot?.weighted_elo_score ?? 1000) - 1000, battles: snapshot?.total_battles_all_time ?? 0 },
  }
  const currentDelta = periodData[period].delta
  const isRising = currentDelta >= 0
  const claimedCount = subscription?.claimed_product_ids?.length ?? 0
  const skuLimit = subscription?.total_sku_limit ?? 1
  const lockedCount = Math.max(0, allProducts.length - claimedCount)

  return (
    <>
        <div style={{ height:52, borderBottom:'1px solid var(--ink-10)', display:'flex', alignItems:'center', padding:'0 28px', gap:16, background:'var(--white)', position:'sticky', top:0, zIndex:100 }}>
          <div style={{ display:'flex', alignItems:'center', background:'var(--surface-1)', borderRadius:'var(--r-sm)', padding:3, gap:1 }}>
            {(['7d','30d','90d','all'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding:'4px 12px', borderRadius:4, fontSize:12, fontWeight:period===p?500:400, color:period===p?'var(--ink)':'var(--ink-50)', background:period===p?'var(--white)':'transparent', boxShadow:period===p?'0 1px 3px rgba(0,0,0,0.08)':'none', cursor:'pointer', fontFamily:'var(--font-sans)', border:'none' }}>
                {p === 'all' ? 'All time' : p}
              </button>
            ))}
          </div>
          <div style={{ width:1, height:20, background:'var(--ink-10)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-50)' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--sage)', animation:'blink 2.5s ease-in-out infinite' }} />
            Live data
          </div>
          <div style={{ flex:1 }} />
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:'var(--r-sm)', fontSize:12, fontWeight:500, color:'var(--ink-50)', border:'1px solid var(--ink-10)', background:'transparent', cursor:'pointer', fontFamily:'var(--font-sans)' }}>Share report</button>
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:'var(--r-sm)', fontSize:12, fontWeight:500, color:'white', background:'var(--sage)', cursor:'pointer', border:'none', fontFamily:'var(--font-sans)' }}>Add SKU</button>
        </div>

        <div style={{
          background: 'var(--sage)',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              fontWeight: 400,
              color: 'white',
              lineHeight: 1.5,
            }}>
              {narrative.headline}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
              {narrative.sub}
            </div>
          </div>
        </div>

        <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:20, flex:1 }}>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignItems:'stretch' }}>
            <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', padding:'28px 32px', display:'flex', flexDirection:'column', border:'1px solid var(--ink-10)', position:'relative', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'var(--surface-1)', display:'grid', placeItems:'center', fontSize:20, fontWeight:500, color:'var(--sage)', border:'1px solid var(--ink-10)', flexShrink:0 }}>{brand.brand_name[0]}</div>
                <div>
                  <div style={{ fontSize:11, fontWeight:500, color:'var(--sage)', textTransform:'uppercase', letterSpacing:'1.3px', marginBottom:3 }}>{brand.brand_name}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:500, color:'var(--ink)', lineHeight:1.15 }}>
                    {productIntelligence[0] ? allProducts.find(p => p.product_id === productIntelligence[0].product_id)?.product_name_display ?? brand.brand_name : brand.brand_name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-30)', marginTop: 2 }}>
                    {snapshot?.category_l1_name ?? 'Data collecting'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--ink-30)', marginBottom:6 }}>Preference Score</div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:80, fontWeight:500, color:'var(--amber)', lineHeight:0.9, letterSpacing:'-3px', display:'flex', alignItems:'baseline' }}>
                {snapshot ? elo.toLocaleString() : '—'}
                <span style={{ fontSize:18, fontWeight:400, color:'var(--ink-30)', letterSpacing:0, marginLeft:6, fontFamily:'var(--font-sans)', marginBottom:8 }}>pts</span>
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:isRising?'var(--sage-pale)':'var(--red-pale)', color:isRising?'var(--sage)':'var(--red)', fontSize:13, fontWeight:500, padding:'4px 10px', borderRadius:20, marginTop:8, marginBottom:20, width:'fit-content' }}>
                {isRising ? '↑' : '↓'} {delta(currentDelta)} pts in {period === 'all' ? 'all time' : period}
              </div>
              <div style={{ display:'flex', gap:0, borderTop:'1px solid var(--ink-10)', paddingTop:18, marginTop:'auto' }}>
                {[
                  { value:`${fmt(snapshot?.elo_percentile_in_category)}th`, label:'Percentile in category' },
                  { value:`${snapshot?.compare_group_rank ?? '—'} / ${snapshot?.compare_group_size ?? '—'}`, label:'Category rank on Dough' },
                  { value:battles.toLocaleString(), label:'Total battles counted' },
                ].map((stat, i) => (
                  <div key={i} style={{ flex:1, paddingRight:i<2?20:0, paddingLeft:i>0?20:0, borderLeft:i>0?'1px solid var(--ink-10)':'none' }}>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:24, fontWeight:500, color:'var(--ink)', lineHeight:1 }}>{stat.value}</div>
                    <div style={{ fontSize:11, color:'var(--ink-50)', marginTop:3, lineHeight:1.4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', padding:'22px 22px 16px', flex:1, border:'1px solid var(--ink-10)', display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:500, letterSpacing:'1.3px', textTransform:'uppercase', color:'var(--ink-30)' }}>30-day trend</div>
                  <div style={{ fontSize:16, fontWeight:500,
                    color: snapshot?.elo_velocity_30d == null ? 'var(--ink-30)'
                      : isRising ? 'var(--sage)' : 'var(--red)' }}>
                    {snapshot?.elo_velocity_30d == null ? '—' : `${isRising ? '+' : ''}${Math.round(snapshot.elo_velocity_30d)} pts`}
                  </div>
                </div>
                <div style={{ fontSize:12, color:'var(--ink-50)', lineHeight:1.5, marginBottom:14 }}>
                  {!snapshot
                    ? 'Trend data builds as battles are recorded.'
                    : snapshot.momentum_label === 'rising'
                      ? 'Preference score is climbing.'
                      : snapshot.momentum_label === 'declining'
                        ? 'Preference score has dipped this period.'
                        : 'Holding steady.'}
                </div>
                <div style={{ flex:1, minHeight:90, position:'relative' }}><Sparkline data={history} /></div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <span style={{ fontSize:10, color:'var(--ink-30)' }}>30 days ago</span>
                  <span style={{ fontSize:10, color:'var(--ink-30)' }}>Today</span>
                </div>
              </div>
              <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', padding:'20px 22px', border:'1px solid var(--ink-10)', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:56, height:56, borderRadius:'50%', border:'2.5px solid var(--sage)', display:'grid', placeItems:'center', flexShrink:0 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:500, color:'var(--sage)', lineHeight:1 }}>{snapshot?.compare_group_rank ?? '—'}</div>
                    <div style={{ fontSize:11, color:'var(--sage)', fontWeight:500 }}>rd</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>of {snapshot?.compare_group_size ?? '—'} in category</div>
                  <div style={{ fontSize:12, color:'var(--ink-50)', marginTop:2, lineHeight:1.4 }}>{snapshot?.compare_group_rank && snapshot.compare_group_rank <= 3 ? 'Top 3 in your category on Dough.' : 'Climbing. Keep battling.'}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--ink)' }}>What the data says</div>
              <div style={{ fontSize:12, fontWeight:500, color:'var(--sage)', cursor:'pointer' }}>Full breakdown</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>

              <div onClick={() => setExpandedCard(expandedCard==='wr'?null:'wr')} style={{ background:'var(--white)', borderRadius:'var(--r-lg)', border:`1px solid ${expandedCard==='wr'?'var(--ink-30)':'var(--ink-10)'}`, padding:20, cursor:'pointer' }}>
                <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.3px', textTransform:'uppercase', color:'var(--ink-30)', marginBottom:6 }}>Head-to-Head</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:14, fontWeight:500, color:'var(--ink)', lineHeight:1.4, marginBottom:16 }}>
                  {(snapshot?.win_rate_30d??0)>0.55?`${brand.brand_name} wins more often than it loses.`:`${brand.brand_name} is in a competitive position.`}
                </div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:48, fontWeight:500, color:'var(--ink)', lineHeight:1, marginBottom:4 }}>{pct(snapshot?.win_rate_30d)}</div>
                <div style={{ height:6, background:'var(--surface-2)', borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                  <div style={{ height:'100%', borderRadius:3, background:'var(--sage)', width:`${Math.round((snapshot?.win_rate_30d??0)*100)}%` }} />
                </div>
                <div style={{ fontSize:12, color:'var(--ink-50)', lineHeight:1.5, marginBottom:12 }}>vs. 51% category average · {snapshot?.total_battles_30d??0} battles this period</div>
                {expandedCard==='wr' && (
                  <div style={{ paddingTop:16, borderTop:'1px solid var(--ink-10)', fontSize:12, color:'var(--ink-50)', lineHeight:1.7 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span>Battles won</span><strong style={{ color:'var(--ink)' }}>{snapshot?.total_wins_30d??'—'}</strong></div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span>Battles lost</span><strong style={{ color:'var(--ink)' }}>{snapshot?.total_losses_30d??'—'}</strong></div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}><span>Unique users</span><strong style={{ color:'var(--ink)' }}>{snapshot?.unique_users_battled_30d??'—'}</strong></div>
                  </div>
                )}
                <div style={{ fontSize:11, color:'var(--ink-30)', marginTop:12 }}>{expandedCard==='wr'?'↑ Collapse':'↕ Click to expand'}</div>
              </div>

              <div style={{ background:'var(--white)', borderRadius:'var(--r-lg)', border:'1px solid var(--ink-10)', padding:20 }}>
                <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.3px', textTransform:'uppercase', color:'var(--ink-30)', marginBottom:6 }}>When They Choose You</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:14, fontWeight:500, color:'var(--ink)', lineHeight:1.4, marginBottom:16 }}>
                  {snapshot?.top_occasions?.[0]?`Strongest in ${snapshot.top_occasions[0].name.toLowerCase()} occasions.`:'Occasion data building up.'}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  {(snapshot?.top_occasions??[]).slice(0,3).map((occ,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--surface-1)', display:'grid', placeItems:'center', fontSize:11, fontWeight:500, color:'var(--ink-50)', flexShrink:0 }}>{i + 1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:500, color:'var(--ink)' }}>{occ.name}</div>
                        <div style={{ fontSize:10, color:'var(--ink-30)', marginTop:1 }}>{occ.battle_count} battles</div>
                      </div>
                      <div style={{ width:64 }}>
                        <div style={{ height:4, background:'var(--surface-2)', borderRadius:2, overflow:'hidden', marginBottom:3 }}>
                          <div style={{ height:'100%', borderRadius:2, background:'var(--sage)', width:`${Math.round(occ.signal_strength*100)}%` }} />
                        </div>
                        <div style={{ fontSize:11, fontWeight:500, color:'var(--ink-50)', textAlign:'right' }}>{Math.round(occ.signal_strength*100)}%</div>
                      </div>
                    </div>
                  ))}
                  {!snapshot?.top_occasions?.length && <div style={{ fontSize:12, color:'var(--ink-30)', lineHeight:1.6 }}>Occasion data populates after 50+ battles.</div>}
                </div>
              </div>

              <div style={{ background:'var(--white)', borderRadius:'var(--r-lg)', border:'1px solid var(--ink-10)', padding:20 }}>
                <div style={{ fontSize:10, fontWeight:500, letterSpacing:'1.3px', textTransform:'uppercase', color:'var(--ink-30)', marginBottom:6 }}>Who Prefers You</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:14, fontWeight:500, color:'var(--ink)', lineHeight:1.4, marginBottom:16 }}>
                  {snapshot?.audience_summary?.top_age_band?`Strongest signal from users ${snapshot.audience_summary.top_age_band}.`:'Audience data building up.'}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {snapshot?.audience_summary?.top_age_band ? (
                    [{label:'18–24'},{label:'25–34'},{label:'35–44'},{label:'45+'}].map(seg => {
                      const isTop = seg.label === snapshot.audience_summary.top_age_band
                      return (
                        <div key={seg.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ fontSize:12, color:'var(--ink-50)', width:48, flexShrink:0 }}>{seg.label}</div>
                          <div style={{ flex:1, height:5, background:'var(--surface-2)', borderRadius:2.5, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:2.5, background: isTop ? 'var(--amber)' : 'var(--ink-10)', width: isTop ? '72%' : '35%' }} />
                          </div>
                          <div style={{ fontSize:12, fontWeight: isTop ? 500 : 400, color: isTop ? 'var(--ink)' : 'var(--ink-50)', width:32, textAlign:'right' }}>
                            {isTop ? 'Top' : '—'}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ fontSize:12, color:'var(--ink-30)', lineHeight:1.6 }}>
                      Audience data builds after 50+ battles with demographic signals.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {competitive && (
            <div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--ink)', marginBottom:12 }}>Where you stand</div>
              <div style={{ background:'var(--white)', borderRadius:'var(--r-lg)', border:'1px solid var(--ink-10)', padding:20 }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:14, fontWeight:500, color:'var(--ink)', lineHeight:1.4, marginBottom:16 }}>
                  {competitive.narrative_summary??`Ranked #${competitive.focal_brand_rank} of ${competitive.total_brands_in_group} in ${competitive.compare_group_name}.`}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {competitive.competitive_ladder.slice(0,6).map((entry,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 8px', borderRadius:'var(--r-sm)', background:entry.is_focal?'var(--sage-pale)':'transparent', border:entry.is_focal?'1px solid rgba(74,124,89,0.18)':'1px solid transparent' }}>
                      <div style={{ fontFamily:'var(--font-serif)', fontSize:13, fontWeight:500, width:20, textAlign:'center', color:entry.is_focal?'var(--sage)':'var(--ink-30)' }}>{entry.rank}</div>
                      <div style={{ flex:1, height:5, background:'var(--surface-2)', borderRadius:2.5, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:2.5, background:entry.is_focal?'var(--sage)':'var(--surface-2)', width:`${Math.round((entry.elo/(competitive.competitive_ladder[0]?.elo||1))*100)}%` }} />
                      </div>
                      <div style={{ fontSize:11, fontWeight:entry.is_focal?500:400, color:entry.is_focal?'var(--sage)':'var(--ink-50)', width:52, textAlign:'right' }}>{entry.is_focal?'You':entry.label}</div>
                      <div style={{ fontFamily:'var(--font-serif)', fontSize:12, fontWeight:500, color:entry.is_focal?'var(--sage)':'var(--ink)', width:38, textAlign:'right' }}>{Math.round(entry.elo).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--ink)', marginBottom:12 }}>Your products</div>
            <div style={{ background:'var(--white)', borderRadius:'var(--r-lg)', border:'1px solid var(--ink-10)', overflow:'hidden' }}>
              <div style={{ padding:'18px 20px 16px', borderBottom:'1px solid var(--ink-10)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:15, fontWeight:500, color:'var(--ink)' }}>Active SKUs on Dough</div>
                  <div style={{ fontSize:12, color:'var(--ink-50)', marginTop:1 }}>{claimedCount} active · {lockedCount} locked · {allProducts.length} total in database</div>
                </div>
                <button style={{ padding:'6px 12px', borderRadius:'var(--r-sm)', fontSize:12, fontWeight:500, color:'var(--ink-50)', border:'1px solid var(--ink-10)', background:'transparent', cursor:'pointer', fontFamily:'var(--font-sans)' }}>Export CSV</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 90px 80px', padding:'8px 20px', background:'var(--surface-1)', fontSize:10, fontWeight:500, letterSpacing:'1px', textTransform:'uppercase', color:'var(--ink-30)', gap:12 }}>
                <div>Product</div><div style={{ textAlign:'right' }}>Score</div><div style={{ textAlign:'right' }}>30d</div><div style={{ textAlign:'right' }}>Rank</div><div style={{ textAlign:'right' }}>Battles</div>
              </div>
              {productIntelligence.map(p => {
                const product = allProducts.find(a => a.product_id === p.product_id)
                return (
                  <div key={p.product_id} style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 90px 80px', padding:'14px 20px', gap:12, alignItems:'center', borderTop:'1px solid var(--ink-10)', cursor:'pointer' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:'var(--surface-1)', display:'grid', placeItems:'center', fontSize:14, fontWeight:500, color:'var(--sage)', flexShrink:0, border:'1px solid var(--ink-10)' }}>{(product?.product_name_display ?? 'P')[0]}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product?.product_name_display??'Product'}</div>
                        <div style={{ fontSize:11, color:'var(--ink-30)', marginTop:2 }}>{p.taxonomy_node_name}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--ink)', textAlign:'right' }}>{fmt(p.global_elo_score)}</div>
                    <div style={{ fontSize:12, fontWeight:500, textAlign:'right', color:(p.elo_velocity_30d??0)>=0?'var(--sage)':'var(--red)' }}>{delta(p.elo_velocity_30d)}</div>
                    <div style={{ fontSize:12, color:'var(--ink-50)', textAlign:'right' }}>{p.elo_percentile!=null?`${fmt(p.elo_percentile)}th %ile`:'—'}</div>
                    <div style={{ fontSize:12, color:'var(--ink-50)', textAlign:'right' }}>{p.total_battles_all_time.toLocaleString()}</div>
                  </div>
                )
              })}
              {!productIntelligence.length && (
                <div style={{ padding:'40px 20px', textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--ink-50)', marginBottom:6 }}>Claim your first SKU</div>
                  <div style={{ fontSize:12, color:'var(--ink-30)', lineHeight:1.6, maxWidth:280, margin:'0 auto 16px' }}>Search for your product in Dough's database and activate it to start seeing data.</div>
                  <button style={{ padding:'10px 20px', background:'var(--sage)', color:'white', fontSize:13, fontWeight:500, borderRadius:'var(--r-sm)', cursor:'pointer', border:'none', fontFamily:'var(--font-sans)' }}>Find your product</button>
                </div>
              )}
              {lockedCount > 0 && (
                <div style={{ padding:'16px 20px', borderTop:'1px solid var(--ink-10)', display:'flex', alignItems:'center', gap:14, background:'var(--amber-pale)' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{lockedCount} more product{lockedCount!==1?'s':''} available to unlock</div>
                    <div style={{ fontSize:12, color:'var(--ink-50)', marginTop:2, lineHeight:1.4 }}>Add SKUs at $100/month each. Your plan includes {skuLimit} SKU{skuLimit!==1?'s':''}.</div>
                  </div>
                  <button style={{ padding:'7px 14px', background:'var(--amber)', color:'white', fontSize:12, fontWeight:500, borderRadius:'var(--r-sm)', cursor:'pointer', border:'none', fontFamily:'var(--font-sans)', whiteSpace:'nowrap' }}>Unlock SKUs</button>
                </div>
              )}
            </div>
          </div>

        </div>
    </>
  )
}
