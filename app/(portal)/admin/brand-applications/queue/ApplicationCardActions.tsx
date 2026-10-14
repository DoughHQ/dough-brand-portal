import type { Dispatch, SetStateAction } from 'react'
import type { BrandApplication, CatalogCandidate } from '@/lib/brandApplications'
import type { BrandApplicationDialog } from './brandApplicationDialog'

export function ApplicationCardActions({
  row,
  pending,
  busy,
  impersonating,
  setDialog,
  setDialogError,
  setCandidateOverride,
}: {
  row: BrandApplication
  pending: boolean
  busy: boolean
  impersonating: boolean
  setDialog: Dispatch<SetStateAction<BrandApplicationDialog>>
  setDialogError: Dispatch<SetStateAction<string | null>>
  setCandidateOverride: Dispatch<SetStateAction<CatalogCandidate[] | null>>
}) {
  return (
    <>
      {!impersonating && pending ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDialogError(null)
              setCandidateOverride(null)
              setDialog({ kind: 'approve', row })
            }}
            style={{
              padding: '8px 14px',
              background: 'var(--sage)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: busy ? 0.55 : 1,
            }}
          >
            Approve &amp; invite
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDialogError(null)
              setDialog({ kind: 'reject', row })
            }}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--ink-10)',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: busy ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: busy ? 0.55 : 1,
            }}
          >
            Reject
          </button>
        </div>
      ) : null}

      {!impersonating &&
      row.status === 'invited' &&
      row.invitation?.status !== 'accepted' ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDialogError(null)
              setDialog({ kind: 'resend', row })
            }}
            style={{
              padding: '8px 14px',
              background: 'var(--sage)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: busy ? 0.55 : 1,
            }}
          >
            Resend invite
          </button>
          {row.invitation?.status === 'pending' ||
          row.invitation?.status === 'expired' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setDialogError(null)
                setDialog({ kind: 'revoke', row })
              }}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                color: 'var(--ink)',
                border: '1px solid var(--ink-10)',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: busy ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)',
                opacity: busy ? 0.55 : 1,
              }}
            >
              Revoke
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
