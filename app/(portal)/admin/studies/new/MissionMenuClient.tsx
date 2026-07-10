'use client'

import type { MissionTemplate } from '@/lib/queries'

export type MissionMenuSelection = {
  kind: 'commissioned'
  missionTemplateId: string
  templateCode: string
  missionType: 'discovery' | 'positioning' | 'head_to_head'
  doughFeeCents: number
}

type Props = {
  templates: MissionTemplate[]
  onSelect: (selection: MissionMenuSelection) => void
}

function formatDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatChain(chain: string[]): string {
  return chain.join(' → ')
}

/** Map DB mission_type enum onto the wizard's coarse study key. */
function wizardMissionType(
  missionType: string
): 'discovery' | 'positioning' | 'head_to_head' {
  if (missionType === 'product_discovery') return 'discovery'
  return 'head_to_head'
}

export default function MissionMenuClient({ templates, onSelect }: Props) {
  const sorted = [...templates].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  )

  if (sorted.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-50)', fontSize: 14 }}>
        No published study templates are available yet.
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      <header style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            fontWeight: 400,
            color: 'var(--ink)',
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          What do you need to know?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-50)', lineHeight: 1.55, margin: 0 }}>
          Protocol shape comes from the published template — not a hardcoded description.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((tmpl) => {
          const hasS2 = tmpl.session2_chain.length > 0
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() =>
                onSelect({
                  kind: 'commissioned',
                  missionTemplateId: tmpl.id,
                  templateCode: tmpl.code,
                  missionType: wizardMissionType(tmpl.mission_type),
                  doughFeeCents: tmpl.price_cents,
                })
              }
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'var(--white)',
                border: '1px solid var(--ink-10)',
                borderRadius: 'var(--r-md)',
                padding: '20px 22px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                    {tmpl.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-30)',
                    }}
                  >
                    {tmpl.code}
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', flexShrink: 0 }}>
                  {formatDollars(tmpl.price_cents)}
                </div>
              </div>

              {tmpl.tagline ? (
                <p style={{ fontSize: 13, color: 'var(--ink-50)', margin: '0 0 12px', lineHeight: 1.45 }}>
                  {tmpl.tagline}
                </p>
              ) : null}

              <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--ink-30)', marginRight: 6 }}>Session 1</span>
                {tmpl.session1_chain.length > 0
                  ? formatChain(tmpl.session1_chain)
                  : '—'}
              </div>

              {hasS2 ? (
                <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginTop: 6 }}>
                  <span style={{ color: 'var(--ink-30)', marginRight: 6 }}>
                    {tmpl.session2_min_hours_after_prev != null
                      ? `Session 2 [≥${tmpl.session2_min_hours_after_prev}h]`
                      : 'Session 2'}
                  </span>
                  {formatChain(tmpl.session2_chain)}
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
