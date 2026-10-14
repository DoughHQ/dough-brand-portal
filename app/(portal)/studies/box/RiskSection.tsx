'use client'

import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS } from '@/lib/box/validity'
import {
  alcoholDetected,
  type BoxRiskDeclarationDraft,
  type BoxTaxonomyRisk,
} from '@/lib/box/risk'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import RiskAlcoholCard from './risk/RiskAlcoholCard'
import RiskAttestation from './risk/RiskAttestation'
import RiskYesNo from './risk/RiskYesNo'
import { riskCard, riskHelp, riskQuestion } from './risk/riskStyles'
import { summarizeRiskSection } from './risk/summarizeRiskSection'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  taxonomyRisk: BoxTaxonomyRisk
  error?: string | null
  sectionDone?: boolean
}

export default function RiskSection({
  draft,
  onChange,
  taxonomyRisk,
  error,
  sectionDone = false,
}: Props) {
  const decl = draft.riskDeclaration
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
        <p role="alert" style={{ ...riskHelp, color: 'var(--red)', fontSize: 14, marginBottom: 8 }}>
          Runoff can&rsquo;t ship cannabis, hemp, CBD, nicotine, or kratom products. Remove
          them from the box or change its category.
        </p>
      ) : null}

      <RiskAlcoholCard decl={decl} detected={alcoholDetected(taxonomyRisk)} onPatch={patch} />

      <div style={riskCard}>
        <p style={riskQuestion}>Does anything in the box contain caffeine?</p>
        <RiskYesNo
          name="risk-caffeine"
          value={decl.containsCaffeine}
          onChange={(v) => patch({ containsCaffeine: v })}
        />
        {decl.containsCaffeine ? (
          <p style={riskHelp}>Respondents see a &ldquo;Contains caffeine&rdquo; label.</p>
        ) : null}
      </div>

      <div style={riskCard}>
        <RiskAttestation
          checked={decl.noProhibitedSubstances}
          onChange={(v) => patch({ noProhibitedSubstances: v })}
        >
          Nothing in this box contains THC, CBD or other hemp-derived ingredients, nicotine,
          or kratom.
        </RiskAttestation>
      </div>

      {error ? (
        <p role="alert" style={{ fontSize: 13, color: 'var(--red)', marginTop: 12 }}>
          {error}
        </p>
      ) : null}
    </BuilderSectionChrome>
  )
}
