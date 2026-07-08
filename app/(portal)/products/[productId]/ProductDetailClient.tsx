'use client'

import { useState, useEffect, type ReactNode, type CSSProperties } from 'react'
import Link from 'next/link'
import type { PortalUser, ProductDetail, ProductBattleHistory } from '@/lib/queries'
import { createClient } from '@/lib/supabase'

interface Props {
  portalUser: PortalUser
  product: ProductDetail
  history: ProductBattleHistory[]
  isClaimed: boolean
  isImpersonating?: boolean
  barcode?: string | null
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

type BrandSku = {
  brand_sku_id: number
  display_label: string
  package_size_value: number | null
  package_size_uom: string | null
  package_count: number | null
  package_type: string | null
  packaging_material: string | null
  packaging_recyclable: string | null
  msrp_cents: number | null
  serving_size_value: number | null
  serving_size_uom: string | null
  servings_per_container: number | null
  is_primary: boolean
  is_active: boolean
}

const PACKAGE_TYPES = ['Glass Jar', 'Tin', 'Plastic Bottle', 'Plastic Bag', 'Cardboard Box', 'Pouch', 'Can', 'Tube', 'Other']
const MATERIALS = ['Glass', 'Plastic', 'Aluminum', 'Cardboard', 'Compostable', 'Mixed']
const RECYCLABLE = ['Yes', 'Partially', 'No']
const SIZE_UOMS = ['oz', 'g', 'kg', 'lbs', 'ml', 'L', 'fl oz', 'count']

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--r-sm)',
  border: '1px solid var(--ink-10)',
  background: 'var(--white)',
  fontSize: 13,
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--r-sm)',
  border: '1px solid var(--ink-10)',
  background: 'var(--white)',
  fontSize: 13,
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  cursor: 'pointer',
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 11, color: 'var(--ink-50)', marginBottom: 5, fontWeight: 400 }}>{children}</div>
}

function SkuManager({ productId, brandId, portalUser }: { productId: number; brandId: number; portalUser: PortalUser }) {
  const supabase = createClient()
  const [skus, setSkus] = useState<BrandSku[]>([])
  const [loaded, setLoaded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    display_label: '',
    package_size_value: '',
    package_size_uom: 'oz',
    package_count: '1',
    package_type: '',
    packaging_material: '',
    packaging_recyclable: '',
    msrp_cents: '',
    serving_size_value: '',
    serving_size_uom: 'g',
    servings_per_container: '',
  })

  useEffect(() => {
    supabase
      .from('brand_product_skus')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .then(({ data }) => {
        setSkus((data ?? []) as BrandSku[])
        setLoaded(true)
      })
  }, [productId])

  function resetForm() {
    setForm({ display_label: '', package_size_value: '', package_size_uom: 'oz', package_count: '1', package_type: '', packaging_material: '', packaging_recyclable: '', msrp_cents: '', serving_size_value: '', serving_size_uom: 'g', servings_per_container: '' })
  }

  async function saveSku() {
    if (!form.display_label.trim()) return
    setSaving(true)
    const payload = {
      product_id: productId,
      brand_id: brandId,
      display_label: form.display_label.trim(),
      package_size_value: form.package_size_value ? Number(form.package_size_value) : null,
      package_size_uom: form.package_size_uom || null,
      package_count: form.package_count ? Number(form.package_count) : null,
      package_type: form.package_type || null,
      packaging_material: form.packaging_material || null,
      packaging_recyclable: form.packaging_recyclable || null,
      msrp_cents: form.msrp_cents ? Math.round(Number(form.msrp_cents) * 100) : null,
      serving_size_value: form.serving_size_value ? Number(form.serving_size_value) : null,
      serving_size_uom: form.serving_size_uom || null,
      servings_per_container: form.servings_per_container ? Number(form.servings_per_container) : null,
      submitted_by_portal_user_id: portalUser.portal_user_id,
      is_primary: skus.length === 0,
    }
    const { data, error } = await supabase.from('brand_product_skus').insert(payload).select().single()
    setSaving(false)
    if (!error && data) {
      setSkus(prev => [...prev, data as BrandSku])
      setAdding(false)
      resetForm()
    }
  }

  async function deleteSku(id: number) {
    await supabase.from('brand_product_skus').update({ is_active: false }).eq('brand_sku_id', id)
    setSkus(prev => prev.filter(s => s.brand_sku_id !== id))
  }

  async function setPrimary(id: number) {
    await supabase.from('brand_product_skus').update({ is_primary: false }).eq('product_id', productId)
    await supabase.from('brand_product_skus').update({ is_primary: true }).eq('brand_sku_id', id)
    setSkus(prev => prev.map(s => ({ ...s, is_primary: s.brand_sku_id === id })))
  }

  const canEdit = portalUser.role === 'dough_admin' || portalUser.role === 'brand_admin'

  return (
    <div>
      {skus.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          {skus.map(sku => (
            <div key={sku.brand_sku_id} style={{
              border: `1px solid ${sku.is_primary ? 'var(--sage)' : 'var(--ink-10)'}`,
              borderRadius: 'var(--r-md)',
              padding: '14px 16px',
              background: sku.is_primary ? 'var(--sage-pale)' : 'var(--white)',
              position: 'relative',
            }}>
              {sku.is_primary && (
                <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 500, color: 'var(--sage)', background: 'white', border: '1px solid var(--sage)', borderRadius: 20, padding: '1px 7px', letterSpacing: '0.04em' }}>
                  PRIMARY
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 6, paddingRight: sku.is_primary ? 60 : 0 }}>
                {sku.display_label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {sku.package_size_value != null && (
                  <div style={{ fontSize: 11, color: 'var(--ink-50)' }}>{sku.package_size_value} {sku.package_size_uom}</div>
                )}
                {sku.package_type && (
                  <div style={{ fontSize: 11, color: 'var(--ink-50)' }}>{sku.package_type}</div>
                )}
                {sku.packaging_recyclable && (
                  <div style={{ fontSize: 11, color: sku.packaging_recyclable === 'Yes' ? 'var(--sage)' : 'var(--ink-30)' }}>
                    {sku.packaging_recyclable === 'Yes' ? 'Recyclable' : sku.packaging_recyclable === 'Partially' ? 'Partially recyclable' : 'Not recyclable'}
                  </div>
                )}
                {sku.msrp_cents != null && (
                  <div style={{ fontSize: 11, color: 'var(--ink-50)' }}>MSRP ${(sku.msrp_cents / 100).toFixed(2)}</div>
                )}
                {sku.serving_size_value != null && (
                  <div style={{ fontSize: 11, color: 'var(--ink-30)' }}>
                    {sku.serving_size_value}{sku.serving_size_uom} serving{sku.servings_per_container ? ` · ${sku.servings_per_container} per container` : ''}
                  </div>
                )}
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {!sku.is_primary && (
                    <button
                      onClick={() => setPrimary(sku.brand_sku_id)}
                      style={{ fontSize: 10, color: 'var(--ink-30)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)' }}
                    >
                      Set primary
                    </button>
                  )}
                  <button
                    onClick={() => deleteSku(sku.brand_sku_id)}
                    style={{ fontSize: 10, color: 'var(--ink-30)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)', marginLeft: 'auto' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loaded && skus.length === 0 && !adding && (
        <div style={{ padding: '20px 0', fontSize: 12, color: 'var(--ink-30)', lineHeight: 1.6 }}>
          No sizes added yet. Add the containers this product comes in — 2oz jar, 6oz tin, etc.
        </div>
      )}

      {adding && (
        <div style={{
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-md)',
          padding: '20px',
          background: 'var(--surface-1)',
          marginBottom: 16,
        }}>
          <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--ink)', marginBottom: 16 }}>Add a size</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

            <div style={{ gridColumn: '1 / -1' }}>
              <FieldLabel>Name (required)</FieldLabel>
              <input
                autoFocus
                value={form.display_label}
                onChange={e => setForm(f => ({ ...f, display_label: e.target.value }))}
                placeholder="e.g. 2 oz Glass Jar"
                style={inputStyle}
              />
            </div>

            <div>
              <FieldLabel>Container size</FieldLabel>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={form.package_size_value}
                  onChange={e => setForm(f => ({ ...f, package_size_value: e.target.value }))}
                  placeholder="2"
                  type="number"
                  style={{ ...inputStyle, width: 70, flexShrink: 0 }}
                />
                <select
                  value={form.package_size_uom}
                  onChange={e => setForm(f => ({ ...f, package_size_uom: e.target.value }))}
                  style={selectStyle}
                >
                  {SIZE_UOMS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel>Package type</FieldLabel>
              <select value={form.package_type} onChange={e => setForm(f => ({ ...f, package_type: e.target.value }))} style={selectStyle}>
                <option value="">Select</option>
                {PACKAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <FieldLabel>Material</FieldLabel>
              <select value={form.packaging_material} onChange={e => setForm(f => ({ ...f, packaging_material: e.target.value }))} style={selectStyle}>
                <option value="">Select</option>
                {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <FieldLabel>Recyclable</FieldLabel>
              <select value={form.packaging_recyclable} onChange={e => setForm(f => ({ ...f, packaging_recyclable: e.target.value }))} style={selectStyle}>
                <option value="">Select</option>
                {RECYCLABLE.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <FieldLabel>MSRP ($)</FieldLabel>
              <input
                value={form.msrp_cents}
                onChange={e => setForm(f => ({ ...f, msrp_cents: e.target.value }))}
                placeholder="3.99"
                type="number"
                step="0.01"
                style={inputStyle}
              />
            </div>

            <div>
              <FieldLabel>Serving size</FieldLabel>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={form.serving_size_value}
                  onChange={e => setForm(f => ({ ...f, serving_size_value: e.target.value }))}
                  placeholder="0.5"
                  type="number"
                  style={{ ...inputStyle, width: 70, flexShrink: 0 }}
                />
                <select value={form.serving_size_uom} onChange={e => setForm(f => ({ ...f, serving_size_uom: e.target.value }))} style={selectStyle}>
                  {SIZE_UOMS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel>Servings per container</FieldLabel>
              <input
                value={form.servings_per_container}
                onChange={e => setForm(f => ({ ...f, servings_per_container: e.target.value }))}
                placeholder="8"
                type="number"
                style={inputStyle}
              />
            </div>

          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={saveSku}
              disabled={saving || !form.display_label.trim()}
              style={{
                padding: '8px 18px',
                background: form.display_label.trim() ? 'var(--sage)' : 'var(--ink-10)',
                color: form.display_label.trim() ? 'white' : 'var(--ink-30)',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 'var(--r-sm)',
                border: 'none',
                cursor: form.display_label.trim() ? 'pointer' : 'default',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {saving ? 'Saving...' : 'Add size'}
            </button>
            <button
              onClick={() => { setAdding(false); resetForm() }}
              style={{ padding: '8px 14px', background: 'transparent', color: 'var(--ink-50)', fontSize: 13, borderRadius: 'var(--r-sm)', border: '1px solid var(--ink-10)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {canEdit && !adding && (
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: '7px 14px',
            background: 'transparent',
            color: 'var(--ink-50)',
            fontSize: 12,
            fontWeight: 400,
            borderRadius: 'var(--r-sm)',
            border: '1px dashed var(--ink-10)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'border-color 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink-30)'; e.currentTarget.style.color = 'var(--ink)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ink-10)'; e.currentTarget.style.color = 'var(--ink-50)' }}
        >
          + Add size
        </button>
      )}
    </div>
  )
}

export default function ProductDetailClient({ portalUser, product, history, isClaimed, isImpersonating, barcode }: Props) {
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

          {barcode && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
              padding: '4px 10px',
              background: 'var(--surface-1)',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--ink-10)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Barcode
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.04em' }}>
                {barcode}
              </div>
            </div>
          )}

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
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
      }}>
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          padding: '24px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>
            Occasions
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-30)', lineHeight: 1.65 }}>
            Purchase occasion data populates after 50+ battles across multiple users.
          </div>
        </div>
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          padding: '24px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 10 }}>
            Audience
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-30)', lineHeight: 1.65 }}>
            Demographic affinity data requires user profile signals. Building as the platform grows.
          </div>
        </div>
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--ink-10)',
          borderRadius: 'var(--r-lg)',
          padding: '24px',
          gridColumn: '1 / -1',
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 20 }}>
            Sizes & packaging
          </div>
          <SkuManager productId={product.product_id} brandId={product.brand_id} portalUser={portalUser} />
        </div>
      </div>

    </div>
  )
}
