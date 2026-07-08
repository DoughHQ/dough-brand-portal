'use client'

import OperatorLaunchpad from '../components/OperatorLaunchpad'

export default function AdminIhutClient() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 960, margin: '0 auto', padding: '36px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-30)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Admin
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', marginBottom: 8 }}>
          Launch IHUT
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, margin: 0, maxWidth: 520 }}>
          Commission a new study or view an existing brand&apos;s portal. You stay in operator mode until you explicitly choose to view as a brand.
        </p>
      </div>
      <OperatorLaunchpad variant="full" />
    </div>
  )
}
