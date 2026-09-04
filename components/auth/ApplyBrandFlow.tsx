'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createClient } from '@/lib/supabase'
import {
  isValidWorkEmail,
  normalizeLinkedInInput,
  normalizeRoleTitle,
  parseBrandSearchHits,
  type ApplicationBrandHit,
} from '@/lib/brandApplicationFlow'
import { safeLinkedInHref } from '@/lib/brandApplications'
import '@/components/auth/authShell.css'

export type ApplyStep = 'search' | 'details' | 'booking'

type Props = {
  step: ApplyStep
  setStep: (step: ApplyStep) => void
  error: string | null
  setError: (error: string | null) => void
  onGoToLogin: () => void
  styles: {
    cardStyle: CSSProperties
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

  function selectBrand(hit: ApplicationBrandHit) {
    setSelectedBrand(hit)
    setTypedBrandName(hit.brand_name)
    setError(null)
    setStep('details')
  }

  function chooseNetNew() {
    setSelectedBrand(null)
    setTypedBrandName(query.trim())
    setError(null)
    setStep('details')
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
      flagged_not_mine_product_ids: [],
    })

    setSubmitting(false)
    if (insertError) {
      console.error('brand_waitlist insert', insertError)
      setError('Something went wrong. Please try again.')
      return
    }
    setStep('booking')
  }

  return (
    <div style={styles.cardStyle}>
      {step === 'search' && (
        <>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 28,
                fontWeight: 400,
                color: 'var(--ink)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: 8,
              }}
            >
              What’s your brand?
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.5 }}>
              See how shoppers already choose your products — apply and we’ll get you set up.
            </div>
          </div>

          <input
            type="search"
            className="auth-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your brand name"
            aria-label="Brand name"
            autoFocus
            style={styles.inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--sage)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
              e.target.style.boxShadow = 'none'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {searching ? (
              <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>Searching…</div>
            ) : null}

            {error ? (
              <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
            ) : null}

            {hits.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {hits.map((hit) => (
                  <button
                    key={hit.brand_id}
                    type="button"
                    className="auth-hit"
                    onClick={() => selectBrand(hit)}
                  >
                    <span className="auth-hit__name">{hit.brand_name}</span>
                    <span className="auth-hit__count">
                      {formatCount(hit.product_count)} products
                    </span>
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
                fontSize: 13,
                color: 'var(--sage)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                textAlign: 'left',
                padding: 0,
                marginTop: hits.length > 0 ? 4 : 0,
              }}
            >
              I don’t see my brand →
            </button>
          </div>

          <div className="auth-panel-foot">
            <button type="button" className="auth-panel-foot__btn" onClick={onGoToLogin}>
              Already have access? <span>Sign in</span>
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
                  {selectedBrand.product_count > 0 ? (
                    <>
                      {' '}
                      · {formatCount(selectedBrand.product_count)} products already in dough
                    </>
                  ) : null}
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
                  className="auth-input"
                  value={typedBrandName}
                  onChange={(e) => setTypedBrandName(e.target.value)}
                  placeholder="Your brand as you’d like it listed"
                  style={styles.inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--sage)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
                    e.target.style.boxShadow = 'none'
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
                className="auth-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jane Smith"
                style={styles.inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--sage)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div>
              <div style={styles.labelStyle}>
                Work email<span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
              </div>
              <input
                type="email"
                className="auth-input"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jane@brand.com"
                autoComplete="email"
                style={styles.inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--sage)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div>
              <div style={styles.labelStyle}>Your role at the brand</div>
              <input
                type="text"
                className="auth-input"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Brand manager, founder…"
                style={styles.inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--sage)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div>
              <div style={styles.labelStyle}>LinkedIn profile</div>
              <input
                type="text"
                className="auth-input"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/you"
                style={styles.inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--sage)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(28, 38, 32, 0.14)'
                  e.target.style.boxShadow = 'none'
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
                  setStep('search')
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
