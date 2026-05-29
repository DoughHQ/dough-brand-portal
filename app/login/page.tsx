'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Step = 'waitlist' | 'submitted' | 'login'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('waitlist')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Waitlist form state
  const [brandName, setBrandName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [brandWebsite, setBrandWebsite] = useState('')
  const [category, setCategory] = useState('')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const supabase = createClient()

  async function handleWaitlistSubmit() {
    if (!brandName.trim() || !contactName.trim() || !contactEmail.trim()) {
      setError('Brand name, contact name, and email are required.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: insertError } = await supabase
      .from('brand_waitlist')
      .insert({
        brand_name: brandName.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim().toLowerCase(),
        brand_website: brandWebsite.trim() || null,
        primary_category: category.trim() || null,
      })
    setLoading(false)
    if (insertError) {
      setError('Something went wrong. Please try again.')
      return
    }
    setStep('submitted')
  }

  async function handleLogin() {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Email and password are required.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword.trim(),
    })
    setLoading(false)
    if (signInError) {
      setError('Invalid credentials.')
      return
    }
    window.location.href = '/dashboard'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface)',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>

      {/* Wordmark */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28,
          fontWeight: 500,
          color: 'var(--sage)',
          letterSpacing: '-0.5px',
        }}>
          dough<span style={{ color: 'var(--ink-30)', fontWeight: 400 }}>.</span>
        </div>
        <div style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          color: 'var(--ink-30)',
          marginTop: 4,
        }}>
          Brand Intelligence
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--white)',
        border: '1px solid var(--ink-10)',
        borderRadius: 'var(--r-xl)',
        padding: '36px 40px',
      }}>

        {step === 'waitlist' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 8,
                lineHeight: 1.3,
              }}>
                Request access
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.6 }}>
                Dough Brand Intelligence is currently invite-only. 
                Submit your information and we will be in touch.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Brand name', value: brandName, set: setBrandName, placeholder: 'McCormick', required: true },
                { label: 'Your name', value: contactName, set: setContactName, placeholder: 'Jane Smith', required: true },
                { label: 'Work email', value: contactEmail, set: setContactEmail, placeholder: 'jane@brand.com', required: true },
                { label: 'Brand website', value: brandWebsite, set: setBrandWebsite, placeholder: 'brand.com', required: false },
                { label: 'Primary category', value: category, set: setCategory, placeholder: 'Spices & Seasonings', required: false },
              ].map(field => (
                <div key={field.label}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--ink-50)',
                    marginBottom: 6,
                    letterSpacing: '0.04em',
                  }}>
                    {field.label}{field.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
                  </div>
                  <input
                    type={field.label === 'Work email' ? 'email' : 'text'}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--ink-10)',
                      background: 'var(--surface)',
                      fontSize: 13,
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                      transition: 'border-color 0.12s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--ink-30)'}
                    onBlur={e => e.target.style.borderColor = 'var(--ink-10)'}
                  />
                </div>
              ))}

              {error && (
                <div style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleWaitlistSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? 'var(--ink-10)' : 'var(--sage)',
                  color: loading ? 'var(--ink-30)' : 'white',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                  fontWeight: 500,
                  border: 'none',
                  cursor: loading ? 'default' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.12s',
                  marginTop: 4,
                }}
              >
                {loading ? 'Submitting...' : 'Request access'}
              </button>

              <div style={{ textAlign: 'center', paddingTop: 4 }}>
                <button
                  onClick={() => { setStep('login'); setError(null) }}
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

        {step === 'submitted' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              fontWeight: 400,
              color: 'var(--ink)',
              marginBottom: 12,
              lineHeight: 1.4,
            }}>
              Request received.
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.7, marginBottom: 24 }}>
              We review every request personally. If your brand is a fit, 
              you will hear from us at {contactEmail} within a few business days.
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>
              Questions? hello@godough.co
            </div>
          </div>
        )}

        {step === 'login' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 8,
              }}>
                Sign in
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-50)' }}>
                For approved brand partners only.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Email', value: loginEmail, set: setLoginEmail, type: 'email', placeholder: 'you@brand.com' },
                { label: 'Password', value: loginPassword, set: setLoginPassword, type: 'password', placeholder: '••••••••' },
              ].map(field => (
                <div key={field.label}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--ink-50)',
                    marginBottom: 6,
                    letterSpacing: '0.04em',
                  }}>
                    {field.label}
                  </div>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--ink-10)',
                      background: 'var(--surface)',
                      fontSize: 13,
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--ink-30)'}
                    onBlur={e => e.target.style.borderColor = 'var(--ink-10)'}
                  />
                </div>
              ))}

              {error && (
                <div style={{ fontSize: 12, color: 'var(--red)' }}>{error}</div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? 'var(--ink-10)' : 'var(--sage)',
                  color: loading ? 'var(--ink-30)' : 'white',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                  fontWeight: 500,
                  border: 'none',
                  cursor: loading ? 'default' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  marginTop: 4,
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => { setStep('waitlist'); setError(null) }}
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
      </div>

      <div style={{ marginTop: 32, fontSize: 11, color: 'var(--ink-30)', textAlign: 'center' }}>
        godough.co · hello@godough.co
      </div>
    </div>
  )
}
