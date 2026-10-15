import type { BrandSnapshot, Brand } from '@/lib/queries'
import { pct } from './dashboardFormat'

export function DashboardInsights({
  brand,
  snapshot,
  expandedCard,
  setExpandedCard,
}: {
  brand: Brand
  snapshot: BrandSnapshot | null
  expandedCard: string | null
  setExpandedCard: (value: string | null) => void
}) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--ink)' }}>What the data says</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:16 }}>

        <div onClick={() => setExpandedCard(expandedCard==='wr'?null:'wr')} style={{ background:'var(--paper)', borderRadius:'var(--r-lg)', border:`1px solid ${expandedCard==='wr'?'var(--ink-30)':'var(--ink-10)'}`, padding:20, cursor:'pointer' }}>
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

        <div style={{ background:'var(--paper)', borderRadius:'var(--r-lg)', border:'1px solid var(--ink-10)', padding:20 }}>
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
      </div>
    </div>
  )
}
