import type { ExperienceSplit } from '@/lib/experiencedReport/types'

export function experienceSplitLabel(
  split: ExperienceSplit,
  focalName: string
): { title: string; detail: string } {
  if (split === 'experienced_vs_experienced') {
    return {
      title: 'Among people who’ve had both',
      detail: `Chose ${focalName} in forced choices where both products were already consumed — the strongest claim.`,
    }
  }
  if (split === 'experienced_vs_hypothetical') {
    return {
      title: `Among people who’ve had ${focalName}`,
      detail:
        'Versus products they haven’t tried — a weaker claim. Never pooled with both-experienced results.',
    }
  }
  return {
    title: String(split).replace(/_/g, ' '),
    detail: '',
  }
}

export function ExperienceSplitLabel({
  split,
  focalName,
  showDetail = true,
}: {
  split: ExperienceSplit
  focalName: string
  /** When false, only the short title — detail is hoisted to the section. */
  showDetail?: boolean
}) {
  const { title, detail } = experienceSplitLabel(split, focalName)
  return (
    <div style={{ marginBottom: showDetail && detail ? 10 : 6 }}>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--sage-dark)',
        }}
      >
        {title}
      </div>
      {showDetail && detail ? (
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            lineHeight: 1.45,
            color: 'var(--ink-muted)',
            marginTop: 4,
          }}
        >
          {detail}
        </div>
      ) : null}
    </div>
  )
}
