'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { BrandSnapshot, ProductIntelligence, CompetitiveSnapshot, PortalUser, Brand, BrandSubscription } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { exitImpersonationAction } from '../admin/impersonation/actions'

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

function InlineEditLink({
  label, value, placeholder, field, brandId, onChange, prefix
}: {
  label: string
  value: string
  placeholder: string
  field: string
  brandId: number
  onChange: (v: string) => void
  prefix?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function save() {
    setSaving(true)
    await supabase.from('brands').update({ [field]: draft || null, updated_at: new Date().toISOString() } as never).eq('brand_id', brandId)
    setSaving(false)
    onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 16 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{label}</span>
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          placeholder={placeholder}
          style={{
            width: 160,
            padding: '3px 8px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-30)',
            background: 'var(--surface)',
            fontSize: 12,
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
          }}
        />
        <button onClick={save} disabled={saving} style={{ padding: '2px 8px', background: 'var(--sage)', color: 'white', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          {saving ? '...' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} style={{ padding: '2px 6px', background: 'transparent', color: 'var(--ink-30)', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>×</button>
      </div>
    )
  }

  return (
    <div
      onClick={() => { setDraft(value); setEditing(true) }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginRight: 16,
        cursor: 'pointer',
        padding: '3px 6px',
        borderRadius: 'var(--r-sm)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{label}</span>
      <span style={{ fontSize: 12, color: value ? 'var(--ink-50)' : 'var(--ink-30)', fontStyle: value ? 'normal' : 'italic' }}>
        {value ? `${prefix ?? ''}${value}` : '+ Add'}
      </span>
    </div>
  )
}

function InlineEditText({
  label, value, placeholder, field, brandId, width = 120
}: {
  label: string
  value: string
  placeholder: string
  field: string
  brandId: number
  width?: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function save() {
    setSaving(true)
    const val = field === 'founded_year' ? (parseInt(draft) || null) : (draft || null)
    await supabase.from('brands').update({ [field]: val, updated_at: new Date().toISOString() } as never).eq('brand_id', brandId)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{label}</span>
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          placeholder={placeholder}
          style={{
            width,
            padding: '3px 8px',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--ink-30)',
            background: 'var(--surface)',
            fontSize: 12,
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
          }}
        />
        <button onClick={save} disabled={saving} style={{ padding: '2px 8px', background: 'var(--sage)', color: 'white', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          {saving ? '...' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} style={{ padding: '2px 6px', background: 'transparent', color: 'var(--ink-30)', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>×</button>
      </div>
    )
  }

  return (
    <div
      onClick={() => { setDraft(value); setEditing(true) }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
        padding: '3px 6px',
        borderRadius: 'var(--r-sm)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>{label}</span>
      <span style={{ fontSize: 12, color: value ? 'var(--ink-50)' : 'var(--ink-30)', fontStyle: value ? 'normal' : 'italic' }}>
        {value || '+ Add'}
      </span>
    </div>
  )
}

export default function DashboardClient({ portalUser, brand, subscription, snapshot, history, productIntelligence, competitive, allProducts, narrative, isImpersonating, totalProductCount }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [period, setPeriod] = useState<Period>('30d')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [brandAbout, setBrandAbout] = useState(brand.about_text ?? '')
  const [brandWebsite, setBrandWebsite] = useState(brand.brand_website_url ?? '')
  const [instagram, setInstagram] = useState(brand.instagram_handle ?? '')
  const [tiktok, setTiktok] = useState(brand.tiktok_handle ?? '')
  const [youtube, setYoutube] = useState(brand.youtube_handle ?? '')
  const [xHandle, setXHandle] = useState(brand.x_handle ?? '')
  const [linkedin, setLinkedin] = useState(brand.linkedin_url ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
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

  async function saveBrandField(field: string, value: string) {
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase
      .from('brands')
      .update({ [field]: value || null, updated_at: new Date().toISOString() } as never)
      .eq('brand_id', brand.brand_id)
    setSaving(false)
    if (error) setSaveError('Save failed. Try again.')
    else setEditing(null)
  }
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
  const lockedCount = Math.max(0, (totalProductCount ?? allProducts.length) - claimedCount)

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

        {isImpersonating && (
          <div style={{
            background: 'var(--amber-pale)',
            borderBottom: '1px solid rgba(192,120,24,0.2)',
            padding: '10px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ fontSize: 12, color: 'var(--amber)', flex: 1 }}>
              Viewing as {brand.brand_name} — this is exactly what they see.
            </div>
            <button
              onClick={async () => {
                const result = await exitImpersonationAction()
                if (!result.ok) return
                router.refresh()
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

          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-xl)',
            marginBottom: 24,
            overflow: 'hidden',
          }}>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr auto',
              gap: 20,
              padding: '24px 28px',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--ink-10)',
            }}>

              <div style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--r-md)',
                background: 'var(--sage)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'white',
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                {brand.logo_url
                  ? <img src={brand.logo_url} alt={brand.brand_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : brand.brand_name[0]
                }
              </div>

              <div>
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 20,
                  fontWeight: 400,
                  color: 'var(--ink)',
                  marginBottom: 6,
                  lineHeight: 1.2,
                }}>
                  {brand.brand_name}
                </div>

                {editing === 'about' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      autoFocus
                      value={brandAbout}
                      onChange={e => setBrandAbout(e.target.value)}
                      placeholder="Tell consumers who you are — one to two sentences."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--r-sm)',
                        border: '1px solid var(--ink-30)',
                        background: 'var(--surface)',
                        fontSize: 13,
                        color: 'var(--ink)',
                        fontFamily: 'var(--font-sans)',
                        outline: 'none',
                        resize: 'vertical',
                        lineHeight: 1.6,
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => saveBrandField('about_text', brandAbout)}
                        disabled={saving}
                        style={{ padding: '5px 14px', background: 'var(--sage)', color: 'white', fontSize: 12, fontWeight: 500, borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditing(null); setBrandAbout(brand.about_text ?? '') }}
                        style={{ padding: '5px 14px', background: 'transparent', color: 'var(--ink-50)', fontSize: 12, borderRadius: 'var(--r-sm)', border: '1px solid var(--ink-10)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                      >
                        Cancel
                      </button>
                      {saveError && <span style={{ fontSize: 12, color: 'var(--red)' }}>{saveError}</span>}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditing('about')}
                    style={{
                      fontSize: 13,
                      color: brandAbout ? 'var(--ink-50)' : 'var(--ink-30)',
                      lineHeight: 1.6,
                      cursor: 'text',
                      padding: '4px 0',
                      borderBottom: '1px dashed transparent',
                      transition: 'border-color 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderBottomColor = 'var(--ink-10)')}
                    onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
                  >
                    {brandAbout || 'Add a short description of your brand — click to edit'}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 2 }}>Products on Dough</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--ink)' }}>
                    {(totalProductCount ?? allProducts.length).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-30)', marginBottom: 2 }}>Total battles</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--ink)' }}>
                    {(snapshot?.total_battles_all_time ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: 0,
              padding: '16px 28px',
              flexWrap: 'wrap',
              alignItems: 'center',
              borderBottom: '1px solid var(--ink-10)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--ink-30)', marginRight: 16, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Links
              </div>

              <InlineEditLink
                label="Website"
                value={brandWebsite}
                placeholder="yourwebsite.com"
                field="brand_website_url"
                brandId={brand.brand_id}
                onChange={setBrandWebsite}
              />

              <InlineEditLink label="Instagram" value={instagram} placeholder="@handle" field="instagram_handle" brandId={brand.brand_id} onChange={setInstagram} prefix="@" />
              <InlineEditLink label="TikTok" value={tiktok} placeholder="@handle" field="tiktok_handle" brandId={brand.brand_id} onChange={setTiktok} prefix="@" />
              <InlineEditLink label="YouTube" value={youtube} placeholder="@channel" field="youtube_handle" brandId={brand.brand_id} onChange={setYoutube} prefix="@" />
              <InlineEditLink label="X" value={xHandle} placeholder="@handle" field="x_handle" brandId={brand.brand_id} onChange={setXHandle} prefix="@" />
              <InlineEditLink label="LinkedIn" value={linkedin} placeholder="linkedin.com/company/..." field="linkedin_url" brandId={brand.brand_id} onChange={setLinkedin} />
            </div>

            <div style={{
              display: 'flex',
              gap: 24,
              padding: '14px 28px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <div style={{ fontSize: 11, color: 'var(--ink-30)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 8 }}>
                About
              </div>
              <InlineEditText
                label="City"
                value={brand.headquarters_city ?? ''}
                placeholder="New York"
                field="headquarters_city"
                brandId={brand.brand_id}
              />
              <InlineEditText
                label="State"
                value={brand.headquarters_state ?? ''}
                placeholder="NY"
                field="headquarters_state"
                brandId={brand.brand_id}
              />
              <InlineEditText
                label="Founded"
                value={brand.founded_year?.toString() ?? ''}
                placeholder="2008"
                field="founded_year"
                brandId={brand.brand_id}
                width={80}
              />
            </div>

          </div>

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

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignItems:'stretch' }}>
            <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', padding:'28px 32px', display:'flex', flexDirection:'column', border:'1px solid var(--ink-10)', position:'relative', overflow:'hidden' }}>
              <div style={{ fontSize:13, color:'var(--ink-30)', marginBottom:20 }}>
                {snapshot?.category_l1_name ?? 'Data collecting'}
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
    </>
  )
}
