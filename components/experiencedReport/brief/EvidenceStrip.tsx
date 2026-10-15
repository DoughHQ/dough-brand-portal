import styles from '../decisionBrief.module.css'

export function EvidenceStrip({
  rankingPct,
  compositionPct,
  reliabilityNote,
}: {
  rankingPct: string | null
  compositionPct: string | null
  reliabilityNote: string
}) {
  return (
    <div className={styles.evidenceStrip}>
      <div>
        <span className={styles.evidenceLabel}>Evidence quality</span>
        <strong className={styles.evidenceTitle}>
          How much weight this preference signal can carry
        </strong>
      </div>
      <div className={styles.evidenceMetrics}>
        <div>
          <strong>{rankingPct ?? '—'}</strong>
          <span>Ranking validation</span>
        </div>
        <div>
          <strong>{compositionPct ?? '—'}</strong>
          <span>Evidence composition</span>
        </div>
        <div className={styles.evidenceNote}>
          <span>{reliabilityNote}</span>
          <a href="#method">See methodology →</a>
        </div>
      </div>
    </div>
  )
}
