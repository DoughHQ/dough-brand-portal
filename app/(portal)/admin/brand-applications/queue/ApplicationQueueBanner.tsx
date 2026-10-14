import type { Dispatch, SetStateAction } from 'react'

export type QueueBanner = {
  message: string
  tone: 'error' | 'warn' | 'info' | 'success'
  detail?: string | null
}

export function ApplicationQueueBanner({
  banner,
  setBanner,
}: {
  banner: QueueBanner | null
  setBanner: Dispatch<SetStateAction<QueueBanner | null>>
}) {
  if (!banner) return null
  return (
    <div
      style={{
        marginBottom: 16,
        padding: '10px 14px',
        borderRadius: 8,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        ...(banner.tone === 'success'
          ? {
              background: 'var(--sage-soft, rgba(74, 103, 65, 0.12))',
              color: 'var(--heading)',
            }
          : banner.tone === 'warn'
            ? {
                background: 'var(--amber-pale, rgba(192,120,24,0.12))',
                color: 'var(--amber, #a66a14)',
              }
            : banner.tone === 'info'
              ? {
                  background: 'var(--surface-1)',
                  color: 'var(--ink)',
                  border: '1px solid var(--ink-10)',
                }
              : {
                  background: 'rgba(180, 35, 24, 0.08)',
                  color: 'var(--red, #b42318)',
                }),
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div>{banner.message}</div>
        {banner.detail ? (
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{banner.detail}</div>
        ) : null}
      </div>
      {banner.tone !== 'success' ? (
        <button
          type="button"
          onClick={() => setBanner(null)}
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            color: 'inherit',
            fontFamily: 'var(--font-sans)',
            padding: 0,
            opacity: 0.75,
          }}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  )
}
