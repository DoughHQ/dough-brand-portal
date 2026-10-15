import { SUPPORT_EMAIL } from '@/lib/productMaster/support'
import type { Props } from './applyModel'
import type { ApplyBrandFlowState } from './useApplyBrandFlow'

export function ApplyBookingStep({
  onGoToLogin,
  contactEmail,
  contactName,
}: Pick<Props, 'onGoToLogin'> & Pick<ApplyBrandFlowState, 'contactEmail' | 'contactName'>) {
  return (
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
        {contactEmail.trim() ? (
          <>
            Thanks
            {contactName.trim() ? `, ${contactName.trim().split(/\s+/)[0]}` : ''}. We review
            every request personally and will reply to{' '}
            <strong style={{ color: 'var(--ink)' }}>{contactEmail.trim()}</strong> within 3
            business days.
          </>
        ) : (
          <>We review every request personally and will reply within 3 business days.</>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>Questions? {SUPPORT_EMAIL}</div>

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
  )
}
