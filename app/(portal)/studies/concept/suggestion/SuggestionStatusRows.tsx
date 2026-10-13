import type { TypeaheadStatus } from '@/lib/concept/useTypeahead'
import { mutedRow, rowStyle } from './suggestionStyles'

export default function SuggestionStatusRows({
  status,
  emptyLabel,
  emptyHint,
  errorLabel,
  onRetry,
}: {
  status: TypeaheadStatus
  emptyLabel: string
  emptyHint?: string
  errorLabel: string
  onRetry: () => void
}) {
  return (
    <>
      {status === 'loading' ? (
        <li style={mutedRow} role="presentation">
          Searching…
        </li>
      ) : null}
      {status === 'error' ? (
        <li role="presentation">
          <button
            type="button"
            onClick={onRetry}
            style={{ ...rowStyle, color: 'var(--red)', borderBottom: 'none' }}
          >
            {errorLabel}
          </button>
        </li>
      ) : null}
      {status === 'empty' ? (
        <li style={mutedRow} role="presentation">
          <div>{emptyLabel}</div>
          {emptyHint ? (
            <div style={{ marginTop: 4, color: 'var(--ink-30)' }}>{emptyHint}</div>
          ) : null}
        </li>
      ) : null}
    </>
  )
}
