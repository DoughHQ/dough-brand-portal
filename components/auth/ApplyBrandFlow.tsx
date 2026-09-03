'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase'
import { ApplicationProductTile } from '@/components/products/ApplicationProductTile'
import {
  isValidWorkEmail,
  normalizeLinkedInInput,
  normalizeRoleTitle,
  parseBrandSearchHits,
  parseProductPreview,
  type ApplicationBrandHit,
  type ApplicationProductPreview,
} from '@/lib/brandApplicationFlow'
import { safeLinkedInHref } from '@/lib/brandApplications'
import '@/components/products/productTile.css'

export type ApplyStep = 'search' | 'products' | 'details' | 'booking'

type Props = {
  step: ApplyStep
  setStep: (step: ApplyStep) => void
  error: string | null
  setError: (error: string | null) => void
  onGoToLogin: () => void
  styles: {
    cardStyle: CSSProperties
    wideCardStyle: CSSProperties
    inputStyle: CSSProperties
    labelStyle: CSSProperties
    primaryBtnStyle: (disabled: boolean) => CSSProperties
  }
}

function formatCount(n: number): string {
  return Math.max(0, Math.trunc(n)).toLocaleString()
}

export default function ApplyBrandFlow({
  step,
  setStep,
  error,
  setError,
  onGoToLogin,
  styles,
}: Props) {
  const searchReqId = useRef(0)

  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<ApplicationBrandHit[]>([])
  const [searching, setSearching] = useState(false)
  const [searchTried, setSearchTried] = useState(false)

  const [selectedBrand, setSelectedBrand] = useState<ApplicationBrandHit | null>(null)
  const [typedBrandName, setTypedBrandName] = useState('')
  const [preview, setPreview] = useState<ApplicationProductPreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [flaggedIds, setFlaggedIds] = useState<number[]>([])

  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setSearching(false)
      setSearchTried(false)
      return
    }

    const id = ++searchReqId.current
    setSearching(true)
    const t = window.setTimeout(() => {
      void (async () => {
        const supabase = createClient()
        try {
          const { data, error: rpcError } = await supabase.rpc('search_brands_for_application', {
            p_query: q,
          })
          if (id !== searchReqId.current) return
          if (rpcError) {
            setHits([])
            setError('Couldn’t search brands. Try again.')
          } else {
            setError(null)
            setHits(parseBrandSearchHits(data))
          }
          setSearchTried(true)
        } catch {
          if (id !== searchReqId.current) return
          setHits([])
          setError('Couldn’t search brands. Try again.')
          setSearchTried(true)
        } finally {
          if (id === searchReqId.current) setSearching(false)
        }
      })()
    }, 300)

    return () => window.clearTimeout(t)
  }, [query, setError])

  const loadPreview = useCallback(
    async (brandId: number) => {
      setLoadingPreview(true)
      setError(null)
      const supabase = createClient()
      try {
        const { data, error: rpcError } = await supabase.rpc('get_brand_products_for_application', {
          p_brand_id: brandId,
          p_limit: 12,
        })
        if (rpcError) {
          setPreview(null)
          setError('Couldn’t load your catalogue. Try again.')
          return false
        }
        const parsed = parseProductPreview(data)
        if (!parsed) {
          setPreview(null)
          setError('Couldn’t load your catalogue. Try again.')
          return false
        }
        setPreview(parsed)
        return true
      } catch {
        setPreview(null)
        setError('Couldn’t load your catalogue. Try again.')
        return false
      } finally {
        setLoadingPreview(false)
      }
    },
    [setError]
  )

  async function selectBrand(hit: ApplicationBrandHit) {
    setSelectedBrand(hit)
    setTypedBrandName(hit.brand_name)
    setFlaggedIds([])
    setPreview(null)
    setStep('products')
    await loadPreview(hit.brand_id)
  }

  function chooseNetNew() {
    setSelectedBrand(null)
    setTypedBrandName(query.trim())
    setPreview(null)
    setFlaggedIds([])
    setError(null)
    setStep('details')
  }

  function toggleFlagged(productId: number) {
    setFlaggedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  async function handleSubmit() {
    const brandName = (selectedBrand?.brand_name ?? typedBrandName).trim()
    if (!brandName) {
      setError('Brand name is required.')
      return
    }
    if (!contactName.trim() || !contactEmail.trim()) {
      setError('Your name and work email are required.')
      return
    }
    if (!isValidWorkEmail(contactEmail)) {
      setError('Enter a valid work email.')
      return
    }
    if (linkedinUrl.trim() && !safeLinkedInHref(linkedinUrl)) {
      setError('LinkedIn should be a normal web link (linkedin.com/…).')
      return
    }

    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    // Anon RLS rejects booking_scheduled_at / booking_ref / invited_at / non-pending status.
    // Do not send those fields. Do not send brand_website / primary_category.
    const { error: insertError } = await supabase.from('brand_waitlist').insert({
      brand_name: brandName.slice(0, 200),
      contact_name: contactName.trim().slice(0, 200),
      contact_email: contactEmail.trim().toLowerCase(),
      brand_id: selectedBrand?.brand_id ?? null,
      role_title: normalizeRoleTitle(roleTitle),
      linkedin_url: normalizeLinkedInInput(linkedinUrl),
      flagged_not_mine_product_ids: flaggedIds,
    })

    setSubmitting(false)
    if (insertError) {
      console.error('brand_waitlist insert', insertError)
      setError('Something went wrong. Please try again.')
      return
    }
    setStep('booking')
  }

  const cardStyle = step === 'products' ? styles.wideCardStyle : styles.cardStyle

  return (
    <div style={cardStyle}>
      {step === 'search' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              What’s your brand?
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.6 }}>
              Search Dough’s catalogue. Sample products help you recognise the right legal-entity
              row — even when the brand name looks unfamiliar.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={styles.labelStyle}>Brand name</div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Start typing — McCormick, Hershey…"
                autoFocus
                style={styles.inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--ink-30)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>

            {searching ? (
              <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>Searching…</div>
            ) : null}

            {error ? (
              <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
            ) : null}

            {hits.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {hits.map((hit) => (
                  <button
                    key={hit.brand_id}
                    type="button"
                    onClick={() => void selectBrand(hit)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--ink-10)',
                      background: 'var(--surface)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'baseline',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--ink)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {hit.brand_name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--ink-30)',
                          whiteSpace: 'nowrap',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatCount(hit.product_count)} products
                      </div>
                    </div>
                    {hit.sample_products.length > 0 ? (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          color: 'var(--ink-50)',
                          lineHeight: 1.45,
                        }}
                      >
                        {hit.sample_products.join(' · ')}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {!searching && searchTried && query.trim().length >= 2 && hits.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
                No brands matched — try another spelling, or say you don’t see your brand.
              </div>
            ) : null}

            <button
              type="button"
              onClick={chooseNetNew}
              style={{
                fontSize: 12,
                color: 'var(--sage)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                textAlign: 'left',
                padding: 0,
              }}
            >
              I don’t see my brand →
            </button>

            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <button
                type="button"
                onClick={onGoToLogin}
                style={{
                  fontSize: 12,
                  color: 'var(--ink-30)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Already have access? Sign in
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'products' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              Are these your products?
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.6 }}>
              Here’s your catalogue in Dough
              {selectedBrand ? (
                <>
                  {' '}
                  for <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{selectedBrand.brand_name}</strong>
                </>
              ) : null}
              .
            </div>
            {preview ? (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: 'var(--ink)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCount(preview.total_count)} products · {formatCount(preview.with_image_count)}{' '}
                with photos
              </div>
            ) : null}
          </div>

          {error ? (
            <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5, marginBottom: 12 }}>
              {error}
            </div>
          ) : null}

          {loadingPreview ? (
            <div style={{ padding: '32px 0', fontSize: 13, color: 'var(--ink-30)' }}>
              Loading catalogue…
            </div>
          ) : preview && preview.products.length > 0 ? (
            <div className="apply-product-grid" style={{ marginBottom: 16 }}>
              {preview.products.map((product) => (
                <ApplicationProductTile
                  key={product.product_id}
                  product={product}
                  flagged={flaggedIds.includes(product.product_id)}
                  onToggleFlagged={() => toggleFlagged(product.product_id)}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                border: '1px dashed var(--ink-10)',
                borderRadius: 12,
                marginBottom: 16,
                fontSize: 13,
                color: 'var(--ink-50)',
                lineHeight: 1.5,
              }}
            >
              No products returned for this brand yet. You can still continue.
            </div>
          )}

          <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.55, marginBottom: 16 }}>
            Missing photos? Something not right? Let’s get you set up.
            {flaggedIds.length > 0 ? (
              <span style={{ color: 'var(--amber)', display: 'block', marginTop: 6 }}>
                {flaggedIds.length} marked as not yours — we’ll review that on the call.
              </span>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setStep('details')
              }}
              disabled={loadingPreview}
              style={{ ...styles.primaryBtnStyle(loadingPreview), width: 'auto', flex: 1, minWidth: 160 }}
            >
              These look right — continue
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setStep('search')
              }}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--ink-10)',
                background: 'transparent',
                color: 'var(--ink-50)',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          </div>
        </>
      )}

      {step === 'details' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              Your details
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.6 }}>
              {selectedBrand ? (
                <>
                  Applying for{' '}
                  <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>
                    {selectedBrand.brand_name}
                  </strong>
                  .
                </>
              ) : (
                <>Tell us who you are and what to call the brand.</>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {selectedBrand == null ? (
              <div>
                <div style={styles.labelStyle}>
                  Brand name<span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
                </div>
                <input
                  type="text"
                  value={typedBrandName}
                  onChange={(e) => setTypedBrandName(e.target.value)}
                  placeholder="Your brand as you’d like it listed"
                  style={styles.inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--ink-30)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--ink-10)'
                  }}
                />
              </div>
            ) : null}

            <div>
              <div style={styles.labelStyle}>
                Your name<span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
              </div>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jane Smith"
                style={styles.inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--ink-30)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>

            <div>
              <div style={styles.labelStyle}>
                Work email<span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
              </div>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jane@brand.com"
                autoComplete="email"
                style={styles.inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--ink-30)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>

            <div>
              <div style={styles.labelStyle}>Your role at the brand</div>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Brand manager, founder…"
                style={styles.inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--ink-30)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>

            <div>
              <div style={styles.labelStyle}>LinkedIn profile</div>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/you"
                style={styles.inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--ink-30)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--ink-10)'
                }}
              />
            </div>

            {error ? (
              <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              style={styles.primaryBtnStyle(submitting)}
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep(selectedBrand ? 'products' : 'search')
                }}
                style={{
                  fontSize: 12,
                  color: 'var(--ink-30)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Back
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'booking' && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 400,
              color: 'var(--ink)',
              marginBottom: 12,
              lineHeight: 1.35,
            }}
          >
            Application received.
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.7, marginBottom: 20 }}>
            Thanks{contactName.trim() ? `, ${contactName.trim().split(/\s+/)[0]}` : ''}. We review
            every request personally
            {contactEmail.trim() ? (
              <>
                {' '}
                and will follow up at <strong style={{ color: 'var(--ink)' }}>{contactEmail.trim()}</strong>
              </>
            ) : null}
            .
          </div>

          {/* TODO: Cal.com / Calendly embed — do not write booking_scheduled_at from the client. */}
          <div
            style={{
              border: '1px dashed rgba(62,107,74,0.35)',
              borderRadius: 12,
              padding: '28px 20px',
              background: 'var(--sage-soft)',
              marginBottom: 18,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--sage-dark)',
                marginBottom: 8,
              }}
            >
              Book a call
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, marginBottom: 8 }}>
              Scheduling embed goes here (Cal.com / Calendly).
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.5 }}>
              Until that’s live, we’ll email you a booking link — no need to refresh this page.
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>Questions? hello@godough.co</div>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              onClick={onGoToLogin}
              style={{
                fontSize: 12,
                color: 'var(--sage)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
              }}
            >
              Already have access? Sign in
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
