'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ApplyBrandFlow, { type ApplyStep } from '@/components/auth/ApplyBrandFlow'
import AuthShell, {
  authCardStyle,
  authInputStyle,
  authLabelStyle,
  authPrimaryBtnStyle,
} from '@/components/auth/AuthShell'

export default function ApplyPage() {
  const router = useRouter()
  const [step, setStep] = useState<ApplyStep>('search')
  const [error, setError] = useState<string | null>(null)

  return (
    <AuthShell>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            fontWeight: 400,
            color: 'var(--ink)',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          Request access
        </div>
      </div>
      <ApplyBrandFlow
        step={step}
        setStep={setStep}
        error={error}
        setError={setError}
        onGoToLogin={() => router.push('/login')}
        styles={{
          cardStyle: authCardStyle,
          inputStyle: authInputStyle,
          labelStyle: authLabelStyle,
          primaryBtnStyle: authPrimaryBtnStyle,
        }}
      />
      {step === 'search' ? (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-50)', fontFamily: 'var(--font-sans)' }}>
            Already have access?{' '}
            <Link
              href="/login"
              style={{ color: 'var(--sage)', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </span>
        </div>
      ) : null}
    </AuthShell>
  )
}
