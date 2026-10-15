import type { ProductIntelligence } from '@/lib/queries'
import { PRODUCT_NAME } from '@/lib/brand'
import { delta, fmt } from './dashboardFormat'

export function DashboardSkuTable({
  productIntelligence,
  allProducts,
  claimedCount,
  lockedCount,
  skuLimit,
  totalProductCount,
  onFindProduct,
}: {
  productIntelligence: ProductIntelligence[]
  allProducts: { product_id: number; product_name_display: string; total_battles: number }[]
  claimedCount: number
  lockedCount: number
  skuLimit: number
  totalProductCount: number | undefined
  onFindProduct: () => void
}) {
  return (
    <div>
      <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--ink)', marginBottom:12 }}>Your products</div>
      <div style={{ background:'var(--paper)', borderRadius:'var(--r-lg)', border:'1px solid var(--ink-10)', overflow:'hidden' }}>
        <div style={{ padding:'18px 20px 16px', borderBottom:'1px solid var(--ink-10)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:15, fontWeight:500, color:'var(--ink)' }}>Active SKUs on {PRODUCT_NAME}</div>
            <div style={{ fontSize:12, color:'var(--ink-50)', marginTop:1 }}>{claimedCount} active · {lockedCount} locked · {totalProductCount ?? allProducts.length} total in database</div>
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
            <div style={{ fontSize:12, color:'var(--ink-30)', lineHeight:1.6, maxWidth:280, margin:'0 auto 16px' }}>Search for your product in {PRODUCT_NAME}&apos;s database and activate it to start seeing data.</div>
            <button
              onClick={() => {
                onFindProduct()
              }}
              style={{ padding:'10px 20px', background:'var(--sage)', color:'white', fontSize:13, fontWeight:500, borderRadius:'var(--r-sm)', cursor:'pointer', border:'none', fontFamily:'var(--font-sans)' }}
            >
              Find your product
            </button>
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
  )
}
