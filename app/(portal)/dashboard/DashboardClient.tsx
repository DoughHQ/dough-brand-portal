'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { BrandSnapshot, ProductIntelligence, CompetitiveSnapshot, PortalUser, Brand, BrandSubscription } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { exitImpersonationAction } from '../admin/impersonation/actions'
import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'
import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'
import type { CatalogHealth } from '@/lib/brandHome/catalogHealth'
import BrandHome from '@/components/brandHome/BrandHome'
import BrandProfileCard from '@/components/brandHome/BrandProfileCard'
import ProductCategoryStandingCard from '@/components/brandHome/ProductCategoryStandingCard'
import Link from 'next/link'
import '@/components/brandHome/brandHome.css'

type Period = '7d' | '30d' | '90d' | 'all'

type CategoryStat = {
  l1_name: string
  l2_name: string
  l3_name: string
  taxonomy_node_id: number
  total_products: number
  products_with_battles: number
  total_battles: number
  total_wins: number
  win_rate_pct: number | null
  top_elo: number | null
  avg_elo: number | null
  top_product_name: string | null
  top_product_id: number | null
}

type CategoryProduct = {
  product_id: number
  product_name_clean: string
  elo_score: number | null
  battles_total: number
  win_rate_pct: number | null
  user_percentile: number | null
  image_url: string | null
}

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
  isImpersonating?: boolean
  totalProductCount?: number
  /** Brand-wide battle appearances from category launcher (not a product scan). */
  totalBattles?: number
  homeModel: BrandHomeModel
  categoriesCount?: number
  signalCards?: ProductSignalCardModel[]
  domainVerified?: boolean
  catalogHealth?: CatalogHealth
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

export default function DashboardClient({ portalUser, brand, subscription, snapshot, history: _history, productIntelligence, competitive: _competitive, allProducts, narrative: _narrative, isImpersonating, totalProductCount, totalBattles = 0, homeModel, categoriesCount, signalCards = [], domainVerified = false, catalogHealth }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [period, setPeriod] = useState<Period>('30d')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set())
  const [catProducts, setCatProducts] = useState<Record<number, CategoryProduct[]>>({})
  const [loadingCatProducts, setLoadingCatProducts] = useState<Set<number>>(new Set())

  useEffect(() => {
    supabase
      .rpc('get_brand_category_stats', { p_brand_id: brand.brand_id })
      .then(({ data }) => setCategoryStats((data ?? []) as CategoryStat[]))
  }, [brand.brand_id])

  function toggleCat(nodeId: number) {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  async function loadCategoryProducts(nodeId: number) {
    if (catProducts[nodeId] || loadingCatProducts.has(nodeId)) return
    setLoadingCatProducts(prev => new Set(prev).add(nodeId))
    const { data } = await supabase.rpc('get_brand_category_products', {
      p_brand_id: brand.brand_id,
      p_taxonomy_node_id: nodeId,
    })
    setCatProducts(prev => ({ ...prev, [nodeId]: (data ?? []) as CategoryProduct[] }))
    setLoadingCatProducts(prev => {
      const next = new Set(prev); next.delete(nodeId); return next
    })
  }

  const claimedCount = subscription?.claimed_product_ids?.length ?? 0
  const skuLimit = subscription?.total_sku_limit ?? 1
  const lockedCount = Math.max(0, (totalProductCount ?? allProducts.length) - claimedCount)

  return (
    <>
        {isImpersonating && (
          <div style={{
            background: 'var(--amber-pale)',
            borderBottom: '1px solid rgba(192,120,24,0.2)',
            padding: '8px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ fontSize: 12, color: 'var(--amber)', flex: 1 }}>
              ✦ Viewing as {brand.brand_name} — this is exactly what they see.
            </div>
            <button
              onClick={async () => {
                const result = await exitImpersonationAction()
                if (!result.ok) return
                router.push('/dashboard')
              }}
              style={{
                fontSize: 12,
                color: 'var(--amber)',
                background: 'transparent',
                border: '1px solid rgba(192,120,24,0.3)',
                borderRadius: 'var(--r-sm)',
                padding: '4px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
              }}
            >
              Back to platform
            </button>
          </div>
        )}

        <BrandHome
          model={homeModel}
          totalProductCount={totalProductCount ?? allProducts.length}
          totalBattles={totalBattles}
          signalCards={signalCards}
          catalogHealth={catalogHealth}
          domainVerified={domainVerified}
          profileSlot={
            <BrandProfileCard
              brand={brand}
              productCount={totalProductCount ?? allProducts.length}
              totalBattles={totalBattles}
              categoriesCount={categoriesCount}
              canSubmitOwnershipCorrection={portalUser.role !== 'brand_viewer'}
              domainVerified={domainVerified}
            />
          }
        />

        <details className="bh-more">
          <summary
            style={{
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ink-50)',
              padding: '12px 0',
              borderTop: '1px solid var(--mist)',
              listStyle: 'none',
            }}
          >
            More brand data
          </summary>

        <div style={{ height:52, borderBottom:'1px solid var(--ink-10)', display:'flex', alignItems:'center', padding:'0 0', gap:16, background:'transparent', marginBottom: 16 }}>
          <div style={{ display:'flex', alignItems:'center', background:'var(--surface-1)', borderRadius:'var(--r-sm)', padding:3, gap:1 }}>
            {(['7d','30d','90d','all'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding:'4px 12px', borderRadius:4, fontSize:12, fontWeight:period===p?500:400, color:period===p?'var(--ink)':'var(--ink-50)', background:period===p?'var(--white)':'transparent', boxShadow:period===p?'0 1px 3px rgba(0,0,0,0.08)':'none', cursor:'pointer', fontFamily:'var(--font-sans)', border:'none' }}>
                {p === 'all' ? 'All time' : p}
              </button>
            ))}
          </div>
          <div style={{ flex:1 }} />
          <Link href="/products" style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:'var(--r-sm)', fontSize:12, fontWeight:500, color:'white', background:'var(--sage)', textDecoration:'none', fontFamily:'var(--font-sans)' }}>Add SKU</Link>
        </div>

        <div style={{ padding:'24px 0', display:'flex', flexDirection:'column', gap:20, flex:1 }}>

          {categoryStats.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 12,
              }}>
                Your categories on Dough
              </div>
              <div style={{
                background: 'var(--white)',
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-lg)',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr 90px 80px 80px 100px',
                  padding: '8px 20px',
                  background: 'var(--surface-1)',
                  borderBottom: '1px solid var(--ink-10)',
                }}>
                  <div />
                  {['Category', 'Products', 'Battles', 'Win rate', 'Top ELO'].map(h => (
                    <div key={h} style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--ink-30)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textAlign: h === 'Category' ? 'left' : 'right',
                    }}>
                      {h}
                    </div>
                  ))}
                </div>

                {categoryStats.map((cat, i) => {
                  const nodeId = Number(cat.taxonomy_node_id)
                  const isExpanded = expandedCats.has(nodeId)
                  const hasBattles = Number(cat.total_battles) > 0
                  const products = catProducts[nodeId] ?? []
                  const isLoading = loadingCatProducts.has(nodeId)

                  return (
                    <div key={nodeId} style={{
                      borderBottom: i < categoryStats.length - 1 ? '1px solid var(--ink-10)' : 'none',
                    }}>
                      <div
                        onClick={() => {
                          toggleCat(nodeId)
                          if (!isExpanded) loadCategoryProducts(nodeId)
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '24px 1fr 90px 80px 80px 100px',
                          padding: '13px 20px',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: isExpanded ? 'var(--surface-1)' : 'transparent',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface-1)' }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{
                          fontSize: 10,
                          color: 'var(--ink-30)',
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.15s',
                          userSelect: 'none',
                        }}>
                          ▶
                        </div>

                        <div>
                          <div style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--ink)',
                          }}>
                            {cat.l3_name ?? cat.l2_name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 1 }}>
                            {cat.l2_name}
                            {cat.top_product_name ? ` · ${cat.top_product_name}` : ''}
                          </div>
                        </div>

                        <div style={{
                          fontSize: 12,
                          color: 'var(--ink-50)',
                          textAlign: 'right',
                        }}>
                          {Number(cat.total_products).toLocaleString()}
                        </div>

                        <div style={{
                          fontSize: 13,
                          fontWeight: hasBattles ? 500 : 400,
                          color: hasBattles ? 'var(--ink)' : 'var(--ink-30)',
                          textAlign: 'right',
                        }}>
                          {hasBattles ? Number(cat.total_battles).toLocaleString() : '—'}
                        </div>

                        <div style={{
                          fontSize: 13,
                          color: cat.win_rate_pct != null ? 'var(--ink)' : 'var(--ink-30)',
                          textAlign: 'right',
                        }}>
                          {cat.win_rate_pct != null ? `${cat.win_rate_pct}%` : '—'}
                        </div>

                        <div style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 16,
                          fontWeight: 400,
                          color: cat.top_elo ? 'var(--ink)' : 'var(--ink-30)',
                          textAlign: 'right',
                        }}>
                          {cat.top_elo ? Math.round(Number(cat.top_elo)) : '—'}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{
                          borderTop: '1px solid var(--ink-10)',
                          background: 'var(--surface)',
                        }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 90px 80px 80px 100px',
                            padding: '6px 20px 6px 44px',
                            borderBottom: '1px solid var(--ink-10)',
                          }}>
                            {['', 'Product', 'Battles', 'Win rate', 'ELO', 'Percentile'].map((h, idx) => (
                              <div key={idx} style={{
                                fontSize: 9,
                                fontWeight: 500,
                                color: 'var(--ink-30)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                textAlign: idx <= 1 ? 'left' : 'right',
                              }}>
                                {h}
                              </div>
                            ))}
                          </div>

                          {isLoading && (
                            <div style={{ padding: '16px 44px', fontSize: 12, color: 'var(--ink-30)' }}>
                              Loading...
                            </div>
                          )}

                          {!isLoading && products.length === 0 && (
                            <div style={{ padding: '16px 44px', fontSize: 12, color: 'var(--ink-30)' }}>
                              No products with battle data in this category yet.
                            </div>
                          )}

                          {products.map((prod, pi) => (
                            <div
                              key={prod.product_id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 1fr 90px 80px 80px 100px',
                                padding: '10px 20px 10px 44px',
                                borderBottom: pi < products.length - 1 ? '1px solid var(--ink-10)' : 'none',
                                alignItems: 'center',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--white)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              onClick={() => { window.location.href = `/products/${prod.product_id}` }}
                            >
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'var(--surface-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}>
                                {prod.image_url ? (
                                  <img
                                    src={prod.image_url}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                ) : (
                                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)' }}>
                                    {prod.product_name_clean[0]}
                                  </span>
                                )}
                              </div>

                              <div style={{
                                fontSize: 13,
                                color: 'var(--ink)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {prod.product_name_clean}
                              </div>

                              <div style={{
                                fontSize: 12,
                                color: prod.battles_total > 0 ? 'var(--ink)' : 'var(--ink-30)',
                                fontWeight: prod.battles_total > 0 ? 500 : 400,
                                textAlign: 'right',
                              }}>
                                {prod.battles_total > 0 ? prod.battles_total : '—'}
                              </div>

                              <div style={{
                                fontSize: 12,
                                color: prod.win_rate_pct != null ? 'var(--ink)' : 'var(--ink-30)',
                                textAlign: 'right',
                              }}>
                                {prod.win_rate_pct != null ? `${Math.round(Number(prod.win_rate_pct))}%` : '—'}
                              </div>

                              <div style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: 14,
                                fontWeight: 400,
                                color: prod.elo_score ? 'var(--ink)' : 'var(--ink-30)',
                                textAlign: 'right',
                              }}>
                                {prod.elo_score ? Math.round(Number(prod.elo_score)) : '—'}
                              </div>

                              <div style={{
                                fontSize: 12,
                                color: prod.user_percentile != null ? 'var(--ink-50)' : 'var(--ink-30)',
                                textAlign: 'right',
                              }}>
                                {prod.user_percentile != null
                                  ? `${Math.round(Number(prod.user_percentile))}th`
                                  : '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {categoryStats.length > 0 && (
                  <div style={{
                    padding: '12px 20px',
                    fontSize: 11,
                    color: 'var(--ink-30)',
                    borderTop: '1px solid var(--ink-10)',
                    background: 'var(--surface-1)',
                  }}>
                    {brand.brand_name} has products in {categoryStats.length} categories.
                    {' '}{categoryStats.filter(c => Number(c.total_battles) > 0).length} have battle data so far.
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <ProductCategoryStandingCard
              catalogProductCount={totalProductCount ?? allProducts.length}
            />
          </div>

          <div>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--ink)' }}>What the data says</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:16 }}>

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
            </div>
          </div>

          <div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--ink)', marginBottom:12 }}>Your products</div>
            <div style={{ background:'var(--white)', borderRadius:'var(--r-lg)', border:'1px solid var(--ink-10)', overflow:'hidden' }}>
              <div style={{ padding:'18px 20px 16px', borderBottom:'1px solid var(--ink-10)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:15, fontWeight:500, color:'var(--ink)' }}>Active SKUs on Dough</div>
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
                  <div style={{ fontSize:12, color:'var(--ink-30)', lineHeight:1.6, maxWidth:280, margin:'0 auto 16px' }}>Search for your product in Dough's database and activate it to start seeing data.</div>
                  <button
                    onClick={() => {
                      router.push('/products')
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

        </div>
        </details>
    </>
  )
}
