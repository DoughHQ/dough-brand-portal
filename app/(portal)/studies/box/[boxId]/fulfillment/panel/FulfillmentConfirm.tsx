import ConfirmDialog from '@/app/(portal)/studies/ConfirmDialog'
import type { BrandFulfillmentState } from './useBrandFulfillment'

export function FulfillmentConfirm({
  confirm,
  setConfirm,
  copy,
  failReason,
  setFailReason,
  pending,
  run,
}: Pick<
  BrandFulfillmentState,
  'confirm' | 'setConfirm' | 'copy' | 'failReason' | 'setFailReason' | 'pending' | 'run'
>) {
  return (
    <ConfirmDialog
      open={confirm != null}
      title={copy?.title ?? ''}
      body={
        copy ? (
          <div>
            <p style={{ margin: confirm?.target === 'delivery_failed' ? '0 0 12px' : 0 }}>
              {copy.body}
            </p>
            {confirm?.target === 'delivery_failed' ? (
              <input
                className="cb-input"
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                placeholder="Reason (optional, logged)"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: 40,
                  border: '1px solid var(--ink-10)',
                  borderRadius: 'var(--r-sm)',
                  padding: '0 12px',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                }}
              />
            ) : null}
          </div>
        ) : null
      }
      confirmLabel={copy?.confirmLabel ?? 'Confirm'}
      tone={copy?.tone ?? 'caution'}
      busy={pending}
      onCancel={() => {
        setConfirm(null)
        setFailReason('')
      }}
      onConfirm={() => {
        if (!confirm) return
        run(confirm.fulfillmentId, confirm.target, {
          reason: confirm.target === 'delivery_failed' ? failReason : undefined,
        })
      }}
    />
  )
}
