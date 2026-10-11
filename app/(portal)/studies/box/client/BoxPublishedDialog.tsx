import type { BoxPublishSuccessMeta } from '@/lib/box/types'

export default function BoxPublishedDialog({
  publishMeta,
  onConfirm,
}: {
  publishMeta: BoxPublishSuccessMeta
  onConfirm: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="box-published-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(20, 24, 20, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          borderRadius: 'var(--r-lg)',
          maxWidth: 480,
          width: '100%',
          padding: 24,
          boxShadow: 'var(--cb-shadow-modal)',
        }}
      >
        <h2
          id="box-published-title"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--ink-80)',
            margin: '0 0 8px',
          }}
        >
          Box is live
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.45 }}>
          The study is open. Qualified users can claim it now — the field is
          frozen and the Dough method prompts are locked.
          {publishMeta.taste_only
            ? ' Plain samples made this study taste-only.'
            : ''}
          {!publishMeta.price_check_enabled
            ? ' Price checks are off.'
            : ''}
        </p>
        {publishMeta.prototype_labels.length > 0 ? (
          <div
            style={{
              margin: '0 0 16px',
              padding: 12,
              border: '1px solid var(--ink-10)',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-1)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-80)',
                marginBottom: 8,
              }}
            >
              Printable study-sample labels (operators only)
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink-70)' }}>
              {publishMeta.prototype_labels.map((label) => (
                <li key={`${label.prototype_id}-${label.code}`} style={{ marginBottom: 6 }}>
                  <code style={{ fontSize: 12 }}>{label.code}</code>
                  {' · '}
                  {label.display_name}
                  {label.internal_label ? (
                    <span style={{ color: 'var(--ink-50)' }}>
                      {' '}
                      (internal: {label.internal_label})
                    </span>
                  ) : null}
                  {' · '}
                  {label.packaging === 'plain_sample' ? 'plain sample' : 'final packaging'}
                </li>
              ))}
            </ul>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-50)' }}>
              Respondents scanning these codes see only “Dough study sample.” Never print
              internal formula names on respondent-facing packaging.
            </p>
          </div>
        ) : null}
        <dl
          style={{
            margin: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px 16px',
            fontSize: 13,
          }}
        >
          <div>
            <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
              Products in box
            </dt>
            <dd style={{ margin: 0 }}>{publishMeta.field_size ?? '—'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
              Completed field
            </dt>
            <dd style={{ margin: 0 }}>
              {publishMeta.target_completions != null
                ? `${publishMeta.target_completions} respondents`
                : '—'}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
              Boxes to prepare
            </dt>
            <dd style={{ margin: 0 }}>
              {publishMeta.physical_units != null &&
              publishMeta.completion_overage_units != null
                ? `${publishMeta.physical_units} · ${publishMeta.completion_overage_units} overage`
                : '—'}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
              Unique pairs
            </dt>
            <dd style={{ margin: 0 }}>{publishMeta.unique_pairs ?? '—'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
              Sessions
            </dt>
            <dd style={{ margin: 0 }}>
              {publishMeta.session_count ?? '—'}
              {publishMeta.session2_interval_hours
                ? ` · ${publishMeta.session2_interval_hours}h apart`
                : ''}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
              Status
            </dt>
            <dd style={{ margin: 0 }}>
              {publishMeta.box_status === 'open' ? 'Open · claimable' : publishMeta.box_status ?? '—'}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
              Audience
            </dt>
            <dd style={{ margin: 0 }}>
              {publishMeta.eligibility_applied ? 'Requirements applied' : 'Open'}
            </dd>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <dt style={{ color: 'var(--ink-50)', fontSize: 11, marginBottom: 4 }}>
              Battle prompts
            </dt>
            <dd style={{ margin: 0, lineHeight: 1.45 }}>
              {publishMeta.taste_only ? (
                <>
                  Taste · Which did you enjoy more?
                  <span style={{ color: 'var(--ink-50)', fontWeight: 500 }}>
                    {' '}
                    · taste-only (shelf skipped)
                  </span>
                </>
              ) : (
                <>
                  Shelf · Which would you pick up?
                  <br />
                  Taste · Which did you enjoy more?
                  <span style={{ color: 'var(--ink-50)', fontWeight: 500 }}>
                    {' '}
                    · locked
                  </span>
                </>
              )}
            </dd>
          </div>
        </dl>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              border: 'none',
              background: 'var(--sage)',
              color: 'var(--on-fill)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 36,
              padding: '0 16px',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
            }}
          >
            Back to studies
          </button>
        </div>
      </div>
    </div>
  )
}
