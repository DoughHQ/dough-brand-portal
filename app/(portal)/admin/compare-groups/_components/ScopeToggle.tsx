'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { CompareGroupScope } from '@/lib/compareGroups.shared'

const OPTIONS: { value: CompareGroupScope; label: string }[] = [
  { value: 'curated_active', label: 'Curated' },
  { value: 'all', label: 'All' },
  { value: 'synthetic', label: 'Synthetic' },
  { value: 'deprecated', label: 'Deprecated' },
]

export default function ScopeToggle({ current }: { current: CompareGroupScope }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setScope(scope: CompareGroupScope) {
    const params = new URLSearchParams(searchParams.toString())
    if (scope === 'curated_active') params.delete('scope')
    else params.set('scope', scope)
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '?')
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid var(--ink-10)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--white)',
      }}
    >
      {OPTIONS.map((o) => {
        const active = current === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setScope(o.value)}
            style={{
              padding: '7px 14px',
              border: 'none',
              borderRight: '1px solid var(--ink-10)',
              background: active ? 'var(--sage-pale, #eef5f0)' : 'transparent',
              color: active ? 'var(--sage)' : 'var(--ink-50)',
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
