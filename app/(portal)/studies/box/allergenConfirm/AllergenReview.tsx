import type { AllergenCode } from '@/lib/box/allergens'
import AllergenChipGroup from './AllergenChipGroup'
import { summaryLine } from './allergenSummary'

export default function AllergenReview({
  loading,
  error,
  contains,
  mayContain,
  help,
  showPicker,
  editing,
  needsLabelCheck,
  onToggle,
  onConfirm,
  onEditList,
  onHideList,
}: {
  loading: boolean
  error: string | null
  contains: Set<string>
  mayContain: Set<string>
  help: string
  showPicker: boolean
  editing: boolean
  needsLabelCheck: boolean
  onToggle: (code: AllergenCode, list: 'contains' | 'may') => void
  onConfirm: () => void
  onEditList: () => void
  onHideList: () => void
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-70)', marginBottom: 4 }}>
        Allergens on the package
      </div>
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--ink-40)', margin: 0 }}>Loading catalog allergens…</p>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--ink-80)', lineHeight: 1.4 }}>
            {summaryLine(contains, mayContain)}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--ink-50)' }}>
            {help}
          </p>
        </>
      )}
      {error ? (
        <p style={{ fontSize: 12, color: 'var(--danger, #b42318)', margin: '6px 0 0' }}>{error}</p>
      ) : null}

      {showPicker ? (
        <div style={{ marginTop: 12 }}>
          <AllergenChipGroup
            title="Contains"
            selected={contains}
            onToggle={(code) => onToggle(code, 'contains')}
          />
          <AllergenChipGroup
            title="May contain"
            selected={mayContain}
            onToggle={(code) => onToggle(code, 'may')}
          />
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <button
          type="button"
          className="cb-btn cb-btn-secondary"
          onClick={onConfirm}
          disabled={loading}
        >
          Confirm
        </button>
        {!showPicker ? (
          <button type="button" className="cb-quiet-action" onClick={onEditList}>
            Edit list
          </button>
        ) : editing ? (
          <button
            type="button"
            className="cb-quiet-action"
            onClick={onHideList}
            disabled={needsLabelCheck}
          >
            Hide list
          </button>
        ) : null}
      </div>
    </div>
  )
}
