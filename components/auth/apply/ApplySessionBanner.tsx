import type { ApplyBrandFlowState } from './useApplyBrandFlow'

export function ApplySessionBanner({
  signedInEmail,
  signingOut,
  handleSignOut,
}: Pick<ApplyBrandFlowState, 'signedInEmail' | 'signingOut' | 'handleSignOut'>) {
  return (
    <div
      role="status"
      style={{
        marginBottom: 16,
        padding: '12px 14px',
        borderRadius: 8,
        background: 'rgba(28, 38, 32, 0.04)',
        border: '1px solid rgba(28, 38, 32, 0.10)',
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 8 }}>
        Signed in as <strong style={{ fontWeight: 600 }}>{signedInEmail}</strong>. Applications
        are anonymous — sign out to request access.
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        style={{
          fontSize: 13,
          color: 'var(--sage)',
          background: 'none',
          border: 'none',
          cursor: signingOut ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          padding: 0,
        }}
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}
