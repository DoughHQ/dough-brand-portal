import type { BoxStudyDraft } from '@/lib/box/types'
import { IHUT_DAY2_JOURNEY } from '@/lib/box/method'
import { BOX_ANCHORS } from '@/lib/box/validity'
import { MODULE_LOYALTY } from '@/lib/study/modules'
import { inputBase, labelSm, subHelp } from './methodStyles'

export default function Day2Panel({
  draft,
  day2On,
  tasteOnly,
  day2OpenId,
  setDay2OpenId,
  onPatch,
}: {
  draft: BoxStudyDraft
  day2On: boolean
  tasteOnly: boolean
  day2OpenId: string | null
  setDay2OpenId: (id: string | null) => void
  onPatch: (partial: Partial<BoxStudyDraft>) => void
}) {
  return (
    <div
      id={BOX_ANCHORS.sessions}
      style={{
        marginTop: 28,
        padding: '16px 18px',
        border: day2On ? '1px solid var(--sage)' : '1px solid var(--ink-10)',
        background: day2On ? 'var(--sage-soft)' : 'var(--paper)',
        borderRadius: 'var(--r-md)',
        maxWidth: 640,
      }}
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          margin: 0,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={day2On}
          onChange={(e) => {
            const on = e.target.checked
            onPatch({
              day2LiveWithIt: on,
              loyaltyFollowUp: on,
              selectedModules: on
                ? Array.from(
                    new Set([
                      ...draft.selectedModules.filter((m) => m !== MODULE_LOYALTY),
                      MODULE_LOYALTY,
                    ])
                  )
                : draft.selectedModules.filter((m) => m !== MODULE_LOYALTY),
            })
          }}
          style={{ marginTop: 3, accentColor: 'var(--sage)' }}
        />
        <span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              fontWeight: 600,
              color: day2On ? 'var(--heading)' : 'var(--ink-80)',
            }}
          >
            Day 2: Live with it
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--ink-50)',
              marginTop: 3,
              lineHeight: 1.4,
            }}
          >
            See what they finished, and whether their favorite held. +40% of
            the Day 1 household fee (shipping unchanged).
          </span>
        </span>
      </label>

      {day2On ? (
        <div style={{ marginTop: 14 }}>
          <div style={labelSm}>Hours between sessions</div>
          <input
            className="cb-input"
            inputMode="numeric"
            value={draft.session2IntervalHours}
            onChange={(e) => {
              const n = Number(e.target.value)
              onPatch({
                session2IntervalHours: Number.isFinite(n) && n > 0 ? n : 48,
              })
            }}
            style={{ ...inputBase, width: 140 }}
          />
          {draft.session2IntervalHours > 0 && draft.session2IntervalHours < 24 ? (
            <p style={{ ...subHelp, marginTop: 6, color: 'var(--amber-warning)' }}>
              Must be at least 24 hours.
            </p>
          ) : (
            <p style={{ ...subHelp, marginTop: 6 }}>Default 48 hours.</p>
          )}
          <p style={{ ...subHelp, marginTop: 14, marginBottom: 8 }}>
            Locked Day 2 screens — same two-scale story, after they&rsquo;ve lived
            with the products.
          </p>
          <div className="cb-acc-stack">
            {IHUT_DAY2_JOURNEY.filter(
              (s) => !(tasteOnly && s.id === 'pack_after_use')
            ).map((step, index) => {
              const open = day2OpenId === step.id
              return (
                <section
                  key={step.id}
                  className={`cb-acc${open ? ' is-open' : ''}`}
                >
                  <h3 className="cb-acc-heading">
                    <button
                      type="button"
                      className="cb-acc-head"
                      aria-expanded={open}
                      onClick={() => setDay2OpenId(open ? null : step.id)}
                    >
                      <span className="cb-acc-index">{index + 1}</span>
                      <span className="cb-acc-main">
                        <span className="cb-acc-title">{step.title}</span>
                        {!open ? (
                          <span className="cb-acc-summary">
                            {step.prompt ?? step.measures}
                          </span>
                        ) : null}
                      </span>
                      <span className="cb-acc-count">Locked</span>
                      <span className="cb-acc-chevron" aria-hidden="true" />
                    </button>
                  </h3>
                  {open ? (
                    <div className="cb-acc-body" role="region">
                      <p className="cb-acc-measures">{step.measures}</p>
                      {step.prompt ? (
                        <div className="cb-acc-asked">
                          <p className="cb-acc-question">{step.prompt}</p>
                          {step.options?.length ? (
                            <ol className="cb-acc-options">
                              {step.options.map((o) => (
                                <li key={o}>{o}</li>
                              ))}
                            </ol>
                          ) : null}
                        </div>
                      ) : null}
                      {step.note ? (
                        <p className="cb-acc-note">{step.note}</p>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
