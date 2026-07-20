'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { SimilarityResult } from '@/lib/compareGroups.shared'

function relationCopy(w: SimilarityResult['node_warnings'][number]): string {
  const name = w.name ?? `Group ${w.compare_group_id}`
  switch (w.relation) {
    case 'identical':
      return `Identical node set to ${name}`
    case 'candidate_subset':
      return `${name} already contains all these nodes (plus ${Math.max(0, w.existing_node_count - w.shared_nodes)} more)`
    case 'candidate_superset':
      return `This set contains all of ${name}'s nodes`
    case 'near_identical':
      return `${w.symmetric_difference} node(s) different from ${name}`
    case 'overlapping':
      return `Shares ${w.shared_nodes} nodes with ${name} (Jaccard ${Number(w.jaccard).toFixed(2)})`
    default:
      return `Related to ${name}`
  }
}

function severityStyle(severity: string): CSSProperties {
  if (severity === 'high') {
    return {
      border: '1px solid rgba(192,120,24,0.45)',
      background: 'rgba(192,120,24,0.12)',
    }
  }
  if (severity === 'medium') {
    return {
      border: '1px solid rgba(192,120,24,0.28)',
      background: 'rgba(192,120,24,0.06)',
    }
  }
  return {
    border: '1px solid var(--ink-10)',
    background: 'var(--cream, #FAF8F3)',
  }
}

type Props = {
  result: SimilarityResult | null
  loading?: boolean
}

export default function SimilarityWarnings({ result, loading }: Props) {
  if (loading) {
    return (
      <div style={{ fontSize: 13, color: 'var(--ink-30)', marginBottom: 12 }}>
        Checking for similar groups…
      </div>
    )
  }
  if (!result || !result.has_warnings) return null

  const loud = result.node_warnings ?? []
  const quiet = result.question_warnings ?? []

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {loud.map((w) => {
        const showLinks =
          w.relation === 'identical' ||
          w.relation === 'near_identical' ||
          w.relation === 'candidate_subset'
        return (
          <div
            key={`${w.compare_group_id}-${w.relation}`}
            style={{
              ...severityStyle(w.severity),
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.45, fontWeight: 500 }}>
              {relationCopy(w)}
            </div>
            {showLinks && (
              <div style={{ marginTop: 8 }}>
                <Link
                  href={`/admin/compare-groups/${w.compare_group_id}`}
                  style={{ fontSize: 13, color: 'var(--sage)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Open {w.name ?? 'group'} →
                </Link>
              </div>
            )}
          </div>
        )
      })}
      {quiet.length > 0 && (
        <div style={{ fontSize: 13, color: 'var(--ink-50)', lineHeight: 1.5 }}>
          {quiet.map((q) => (
            <div key={q.compare_group_id} style={{ marginBottom: 4 }}>
              Similar wording to{' '}
              <Link
                href={`/admin/compare-groups/${q.compare_group_id}`}
                style={{ color: 'var(--sage)', textDecoration: 'none' }}
              >
                {q.name ?? `Group ${q.compare_group_id}`}
              </Link>
              : &ldquo;{q.question}&rdquo;
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 12, color: 'var(--ink-30)' }}>
        Warnings are advisory — you can still create or save this group.
      </div>
    </div>
  )
}
