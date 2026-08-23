'use client'

import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS } from '@/lib/box/validity'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  error?: string | null
}

const DEFAULT_SESSION_INTERVAL_HOURS = 48
const DEFAULT_ABANDON_WINDOW_DAYS = 14

/** Integer-only. Decimals would 500 on the RPC's integer/smallint casts. */
function intFromInput(v: string): number | null {
  const t = v.trim()
  if (!t) return null
  if (!/^-?\d+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) ? n : null
}

/** datetime-local wants "YYYY-MM-DDTHH:mm"; the draft stores full ISO. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function LogisticsSection({ draft, onChange, error }: Props) {
  return (
    <section id={BOX_ANCHORS.logistics} style={card}>
      <div style={eyebrow}>Section 4 · Logistics</div>
      <h2 className="cb-section-title" style={titleStyle}>
        Shipping and sessions
      </h2>
      <p style={helpStyle}>
        How many boxes exist, how the tasting is paced, and when the study closes.
      </p>

      {/* units */}
      <div id={BOX_ANCHORS.units} style={{ marginBottom: 28 }}>
        <div style={labelSm}>How many boxes will ship</div>
        <input
          className="cb-input"
          inputMode="numeric"
          value={draft.physicalUnits ?? ''}
          onChange={(e) => onChange({ ...draft, physicalUnits: intFromInput(e.target.value) })}
          placeholder="e.g. 50"
          style={{ ...inputBase, width: 140 }}
        />
        <p style={{ ...subHelp, marginTop: 6, maxWidth: 480 }}>
          This is the number of claim seats. When they&rsquo;re gone, the box stops
          accepting claims.
        </p>
      </div>

      {/* loyalty / session 2 */}
      <div id={BOX_ANCHORS.sessions} style={{ marginBottom: 28 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            cursor: 'pointer',
            maxWidth: 560,
          }}
        >
          <input
            type="checkbox"
            checked={draft.loyaltyFollowUp}
            onChange={(e) =>
              onChange({ ...draft, loyaltyFollowUp: e.target.checked })
            }
            style={{ marginTop: 3 }}
          />
          <span>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--ink-80)',
              }}
            >
              Add loyalty follow-up (Session 2)
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--ink-50)',
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              A second session unlocks preference drift — did it grow on them?
              Requires at least 24 hours between sessions.
            </span>
          </span>
        </label>
        {draft.loyaltyFollowUp ? (
          <div style={{ marginTop: 12, marginLeft: 28 }}>
            <div style={labelSm}>Hours between sessions</div>
            <input
              className="cb-input"
              inputMode="numeric"
              value={draft.session2IntervalHours}
              onChange={(e) => {
                const n = intFromInput(e.target.value)
                onChange({
                  ...draft,
                  session2IntervalHours: n ?? DEFAULT_SESSION_INTERVAL_HOURS,
                })
              }}
              placeholder="e.g. 48"
              style={{ ...inputBase, width: 140 }}
            />
            {draft.session2IntervalHours > 0 && draft.session2IntervalHours < 24 ? (
              <p style={{ ...subHelp, marginTop: 6, color: 'var(--amber-warning)' }}>
                Must be at least 24 hours.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* abandon window */}
      <div style={{ marginBottom: 28 }}>
        <div style={labelSm}>Grace period after delivery (days)</div>
        <input
          className="cb-input"
          inputMode="numeric"
          value={draft.abandonWindowDays}
          onChange={(e) => {
            const n = intFromInput(e.target.value)
            onChange({
              ...draft,
              abandonWindowDays: n ?? DEFAULT_ABANDON_WINDOW_DAYS,
            })
          }}
          style={{ ...inputBase, width: 140 }}
        />
        <p style={{ ...subHelp, marginTop: 6, maxWidth: 520 }}>
          How long a claimant has to complete the study after the box arrives before the
          seat is released. Default 14.
        </p>
      </div>

      {/* expiry + target */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div id={BOX_ANCHORS.expiry}>
          <div style={labelSm}>Study closes</div>
          <input
            type="datetime-local"
            className="cb-input"
            value={isoToLocalInput(draft.expiresAt)}
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              const d = new Date(v)
              if (!Number.isNaN(d.getTime())) {
                onChange({ ...draft, expiresAt: d.toISOString() })
              }
            }}
            style={{ ...inputBase, width: 240 }}
          />
        </div>
        <div>
          <div style={labelSm}>Target completions (optional)</div>
          <input
            className="cb-input"
            inputMode="numeric"
            value={draft.targetCompletions ?? ''}
            onChange={(e) =>
              onChange({ ...draft, targetCompletions: intFromInput(e.target.value) })
            }
            placeholder="e.g. 40"
            style={{ ...inputBase, width: 160 }}
          />
          <p style={{ ...subHelp, marginTop: 6, maxWidth: 220 }}>
            Closes the study early once this many finish.
          </p>
        </div>
      </div>

      {/* blind sponsor */}
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--ink-10)' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', maxWidth: 560 }}>
          <input
            type="checkbox"
            checked={draft.blindSponsor}
            onChange={(e) => onChange({ ...draft, blindSponsor: e.target.checked })}
            style={{ marginTop: 3 }}
          />
          <span>
            <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--ink-80)' }}>
              Hide our brand from respondents
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-50)', marginTop: 2, lineHeight: 1.4 }}>
              A research-heavy posture — respondents don&rsquo;t see who funded the box,
              reducing brand-affinity bias in the results.
            </span>
          </span>
        </label>
      </div>

      {error ? (
        <p role="alert" style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </section>
  )
}

const card = {
  background: 'var(--white)',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-lg)',
  padding: 32,
  marginBottom: 24,
  boxShadow: 'var(--cb-shadow-card)',
}
const eyebrow = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'var(--ink-50)',
  marginBottom: 8,
}
const titleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: 26,
  fontWeight: 400,
  letterSpacing: '-0.02em',
  margin: '0 0 8px',
  color: 'var(--ink-80)',
}
const helpStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink-50)',
  margin: '0 0 24px',
  lineHeight: 1.45,
  maxWidth: 640,
}
const subHelp = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--ink-50)',
  margin: 0,
  lineHeight: 1.4,
}
const labelSm = {
  display: 'block' as const,
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 8,
}
const inputBase = {
  boxSizing: 'border-box' as const,
  height: 48,
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-sm)',
  padding: '0 16px',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
}
