'use client'

import type { ScopeSearchHit } from '@/lib/categoryReport/scopeSearch'
import type { CategoryScope } from '@/lib/categoryReport/types'
import { ScopeSearchField } from './scope/ScopeSearchField'
import { ScopeSearchSelection } from './scope/ScopeSearchSelection'
import { useScopeSearch } from './scope/useScopeSearch'

type Props = {
  scope: CategoryScope | null
  scopeId: number | null
  scopeName: string | null
  onSelect: (hit: ScopeSearchHit) => void
  onClear: () => void
}

export default function ScopeSearch({ scope, scopeId, scopeName, onSelect, onClear }: Props) {
  const search = useScopeSearch({ scope, scopeId, scopeName, onSelect })

  if (!search.editing && search.hasSelection && search.scope != null) {
    return (
      <ScopeSearchSelection
        scope={search.scope}
        displayName={search.displayName}
        reset={search.reset}
        setEditing={search.setEditing}
        onClear={onClear}
      />
    )
  }

  return <ScopeSearchField {...search} />
}
