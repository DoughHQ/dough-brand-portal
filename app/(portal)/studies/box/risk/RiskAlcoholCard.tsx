'use client'

import { ALCOHOL_MIN_AGE, type BoxRiskDeclarationDraft } from '@/lib/box/risk'
import RiskAttestation from './RiskAttestation'
import RiskYesNo from './RiskYesNo'
import { riskCard, riskHelp, riskQuestion } from './riskStyles'

export default function RiskAlcoholCard({
  decl,
  detected,
  onPatch,
}: {
  decl: BoxRiskDeclarationDraft
  detected: boolean
  onPatch: (partial: Partial<BoxRiskDeclarationDraft>) => void
}) {
  const alcohol = decl.containsAlcohol === true || detected
  return (
    <div style={riskCard}>
      <p style={riskQuestion}>Does anything in the box contain alcohol?</p>
      <RiskYesNo
        name="risk-alcohol"
        value={detected ? true : decl.containsAlcohol}
        disabled={detected}
        onChange={(v) =>
          onPatch({
            containsAlcohol: v,
            alcoholShippingCompliant: v ? decl.alcoholShippingCompliant : false,
          })
        }
      />
      {detected ? (
        <p style={riskHelp}>Set from the box&rsquo;s category or one of its products.</p>
      ) : null}
      {alcohol ? (
        <>
          <p style={riskHelp}>
            Only people {ALCOHOL_MIN_AGE} and older, with a birth date on file, will see this
            box. Respondents are told not to share it with anyone under {ALCOHOL_MIN_AGE}.
          </p>
          <div style={{ marginTop: 12 }}>
            <RiskAttestation
              checked={decl.alcoholShippingCompliant}
              onChange={(v) => onPatch({ alcoholShippingCompliant: v })}
            >
              We&rsquo;re licensed to ship alcohol to every state this box goes to, and every
              delivery needs an adult ({ALCOHOL_MIN_AGE}+) signature.
            </RiskAttestation>
          </div>
        </>
      ) : null}
    </div>
  )
}
