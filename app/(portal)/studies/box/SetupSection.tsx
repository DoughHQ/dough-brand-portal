'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS, type BoxPublishFailure } from '@/lib/box/validity'
import { summarizeBoxSetup } from '@/lib/box/builderSummaries'
import {
  getTaxonomyNodeAction,
  type TaxonomyNodeInfo,
} from '../concept/actions'
import CategoryCombobox from '../concept/CategoryCombobox'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  error?: string | null
  publishFailure?: BoxPublishFailure | null
  /** When true, the section collapses (parent owns identity + scale validity). */
  sectionDone?: boolean
}

const DEFAULT_ABANDON_WINDOW_DAYS = 14

function intFromInput(v: string): number | null {
  const t = v.trim()
  if (!t) return null
  if (!/^-?\d+$/.test(t)) return null
  const n = Number(t)
  return Number.isSafeInteger(n) ? n : null
}

function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Setup mirrors concept: identity (name + category) plus run scale
 * (boxes, grace, close date). Field / Questions / Audience stay separate.
 * Shipping checkout stays for later — not here.
 */
export default function SetupSection({
  draft,
  onChange,
  error,
  sectionDone = false,
}: Props) {
  const [node, setNode] = useState<TaxonomyNodeInfo | null>(null)

  useEffect(() => {
    if (draft.taxonomyNodeId == null) {
      setNode(null)
      return
    }
    let cancelled = false
    void getTaxonomyNodeAction(draft.taxonomyNodeId).then((n) => {
      if (!cancelled) setNode(n)
    })
    return () => {
      cancelled = true
    }
  }, [draft.taxonomyNodeId])

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.setup}
      title="Setup"
      summary={summarizeBoxSetup(draft)}
      done={sectionDone}
    >
      <p style={helpStyle}>
        Name the study, pick the category, and set how many boxes ship. Then
        build who goes in the box below.
      </p>

      <div style={{ marginBottom: 24, maxWidth: 480 }}>
        <label htmlFor={BOX_ANCHORS.name} style={labelSm}>
          Study name
        </label>
        <input
          id={BOX_ANCHORS.name}
          className="cb-input"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="e.g. Gluten-free NYC discovery box"
          style={{ ...inputBase, width: '100%' }}
        />
      </div>

      <div id={BOX_ANCHORS.category} style={{ marginBottom: 28, maxWidth: 560 }}>
        <div style={labelSm}>Category</div>
        <CategoryCombobox
          selected={node}
          pendingNodeId={draft.taxonomyNodeId}
          required
          onSelect={(n) => {
            setNode(n)
            onChange({ ...draft, taxonomyNodeId: n.taxonomy_node_id })
          }}
          onClear={() => {
            setNode(null)
            onChange({ ...draft, taxonomyNodeId: null })
          }}
          error={error ?? null}
        />
      </div>

      <div
        id={BOX_ANCHORS.logistics}
        style={{
          paddingTop: 8,
          borderTop: '1px solid var(--ink-10)',
        }}
      >
        <p style={{ ...runLede, marginBottom: 16 }}>How the study runs</p>

        <div id={BOX_ANCHORS.units} style={{ marginBottom: 24 }}>
          <div style={labelSm}>How many boxes will ship</div>
          <input
            className="cb-input"
            inputMode="numeric"
            value={draft.physicalUnits ?? ''}
            onChange={(e) =>
              onChange({ ...draft, physicalUnits: intFromInput(e.target.value) })
            }
            placeholder="e.g. 50"
            style={{ ...inputBase, width: 140 }}
          />
          <p style={{ ...subHelp, marginTop: 6, maxWidth: 480 }}>
            Claim seats for the box. When they&rsquo;re gone, claims stop.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
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
            How long a claimant has after the box arrives before the seat is
            released. Default 14.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
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
                onChange({
                  ...draft,
                  targetCompletions: intFromInput(e.target.value),
                })
              }
              placeholder="e.g. 40"
              style={{ ...inputBase, width: 160 }}
            />
            <p style={{ ...subHelp, marginTop: 6, maxWidth: 220 }}>
              Closes early once this many finish.
            </p>
          </div>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            cursor: 'pointer',
            maxWidth: 560,
            margin: 0,
          }}
        >
          <input
            type="checkbox"
            checked={draft.blindSponsor}
            onChange={(e) =>
              onChange({ ...draft, blindSponsor: e.target.checked })
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
              Hide our brand from respondents
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
              Respondents don&rsquo;t see who funded the box, reducing
              brand-affinity bias.
            </span>
          </span>
        </label>
      </div>

      {error ? (
        <p role="alert" style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </p>
      ) : null}
    </BuilderSectionChrome>
  )
}

const helpStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink-50)',
  margin: '0 0 24px',
  lineHeight: 1.45,
  maxWidth: 640,
}

const runLede: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ink-80)',
  margin: 0,
}

const subHelp: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--ink-50)',
  margin: 0,
  lineHeight: 1.4,
}

const labelSm: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ink-50)',
  marginBottom: 8,
}

const inputBase: CSSProperties = {
  boxSizing: 'border-box',
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
