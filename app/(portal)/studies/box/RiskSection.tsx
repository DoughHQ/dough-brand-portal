'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS } from '@/lib/box/validity'
import {
  ALCOHOL_MIN_AGE,
  alcoholDetected,
  type BoxRiskDeclarationDraft,
  type BoxTaxonomyRisk,
} from '@/lib/box/risk'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  taxonomyRisk: BoxTaxonomyRisk
  error?: string | null
  sectionDone?: boolean
}

const question: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  margin: '0 0 8px',
}

const help: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--ink-50)',
  lineHeight: 1.4,
  margin: '4px 0 0',
}

const card: CSSProperties = {
  padding: '14px 16px',
  border: '1px solid var(--ink-10)',
  borderRadius: 'var(--r-md)',
  background: 'var(--paper)',
  maxWidth: 640,
  marginTop: 14,
}

function YesNo({
  name,
  value,
  disabled = false,
  onChange,
}: {
  name: string
  value: boolean | null
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div role="radiogroup" style={{ display: 'flex', gap: 20 }}>
      {[true, false].map((v) => (
        <label
          key={String(v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            cursor: disabled ? 'default' : 'pointer',
            color: disabled ? 'var(--ink-50)' : 'var(--ink-80)',
          }}
        >
          <input
            type="radio"
            name={name}
            checked={value === v}
            disabled={disabled}
            onChange={() => onChange(v)}
            style={{ accentColor: 'var(--sage)' }}
          />
          {v ? 'Yes' : 'No'}
        </label>
      ))}
    </div>
  )
}

function Attestation({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, accentColor: 'var(--sage)' }}
      />
      <span style={{ fontSize: 14, color: 'var(--ink-80)', lineHeight: 1.45 }}>{children}</span>
    </label>
  )
}

export function summarizeRiskSection(
  decl: BoxRiskDeclarationDraft,
  taxonomyRisk: BoxTaxonomyRisk
): string {
  const alcohol = decl.containsAlcohol === true || alcoholDetected(taxonomyRisk)
  const parts: string[] = []
  if (alcohol) parts.push(`${ALCOHOL_MIN_AGE}+ · Contains alcohol`)
  if (decl.containsCaffeine) parts.push('Contains caffeine')
  if (parts.length) return parts.join(' · ')
  if (decl.containsAlcohol === false && decl.containsCaffeine === false) {
    return 'No alcohol or caffeine'
  }
  return 'Not answered yet'
}

export default function RiskSection({
  draft,
  onChange,
  taxonomyRisk,
  error,
  sectionDone = false,
}: Props) {
  const decl = draft.riskDeclaration
  const detected = alcoholDetected(taxonomyRisk)
  const alcohol = decl.containsAlcohol === true || detected
  const restricted =
    taxonomyRisk.status === 'ready' && taxonomyRisk.restrictedNodeIds.length > 0

  const patch = (partial: Partial<BoxRiskDeclarationDraft>) =>
    onChange({ ...draft, riskDeclaration: { ...decl, ...partial } })

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.risk}
      title="What's in this box"
      summary={summarizeRiskSection(decl, taxonomyRisk)}
      done={sectionDone}
    >
      {restricted ? (
        <p role="alert" style={{ ...help, color: 'var(--red)', fontSize: 14, marginBottom: 8 }}>
          Runoff can&rsquo;t ship cannabis, hemp, CBD, nicotine, or kratom products. Remove
          them from the box or change its category.
        </p>
      ) : null}

      <div style={card}>
        <p style={question}>Does anything in the box contain alcohol?</p>
        <YesNo
          name="risk-alcohol"
          value={detected ? true : decl.containsAlcohol}
          disabled={detected}
          onChange={(v) =>
            patch({
              containsAlcohol: v,
              alcoholShippingCompliant: v ? decl.alcoholShippingCompliant : false,
            })
          }
        />
        {detected ? (
          <p style={help}>Set from the box&rsquo;s category or one of its products.</p>
        ) : null}
        {alcohol ? (
          <>
            <p style={help}>
              Only people {ALCOHOL_MIN_AGE} and older, with a birth date on file, will see this
              box. Respondents are told not to share it with anyone under {ALCOHOL_MIN_AGE}.
            </p>
            <div style={{ marginTop: 12 }}>
              <Attestation
                checked={decl.alcoholShippingCompliant}
                onChange={(v) => patch({ alcoholShippingCompliant: v })}
              >
                We&rsquo;re licensed to ship alcohol to every state this box goes to, and every
                delivery needs an adult ({ALCOHOL_MIN_AGE}+) signature.
              </Attestation>
            </div>
          </>
        ) : null}
      </div>

      <div style={card}>
        <p style={question}>Does anything in the box contain caffeine?</p>
        <YesNo
          name="risk-caffeine"
          value={decl.containsCaffeine}
          onChange={(v) => patch({ containsCaffeine: v })}
        />
        {decl.containsCaffeine ? (
          <p style={help}>Respondents see a &ldquo;Contains caffeine&rdquo; label.</p>
        ) : null}
      </div>

      <div style={card}>
        <Attestation
          checked={decl.noProhibitedSubstances}
          onChange={(v) => patch({ noProhibitedSubstances: v })}
        >
          Nothing in this box contains THC, CBD or other hemp-derived ingredients, nicotine,
          or kratom.
        </Attestation>
      </div>

      {error ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginTop: 12 }}>
          {error}
        </p>
      ) : null}
    </BuilderSectionChrome>
  )
}
