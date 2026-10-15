'use client'

import { ImpersonateHeader } from './search/ImpersonateHeader'
import { ImpersonateResults } from './search/ImpersonateResults'
import { ImpersonateSearchInput } from './search/ImpersonateSearchInput'
import { useImpersonateSearch } from './search/useImpersonateSearch'

export type { ImpersonateBrandHit } from './search/useImpersonateSearch'

export default function ImpersonateBrandClient({
  currentImpersonatedBrandId,
}: {
  currentImpersonatedBrandId: number | null
}) {
  const { entering, query, setQuery, hits, searching, error, pendingId, pick } = useImpersonateSearch()

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 720, margin: '0 auto', padding: '36px 32px 80px' }}>
      <ImpersonateHeader />

      <ImpersonateSearchInput query={query} setQuery={setQuery} searching={searching} />

      {error ? (
        <div
          style={{
            fontSize: 13,
            color: 'var(--clay, #a6543c)',
            marginBottom: 12,
            padding: '10px 12px',
            background: 'var(--surface)',
            borderRadius: 8,
            border: '1px solid var(--ink-10)',
          }}
        >
          {error}
        </div>
      ) : null}

      <ImpersonateResults
        query={query}
        hits={hits}
        searching={searching}
        entering={entering}
        pendingId={pendingId}
        pick={pick}
        currentImpersonatedBrandId={currentImpersonatedBrandId}
      />
    </div>
  )
}
