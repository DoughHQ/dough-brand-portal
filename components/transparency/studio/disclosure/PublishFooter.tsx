import type { Props } from './disclosureProps'

export function PublishFooter({
  draft,
  canEdit,
  saving,
  onChange,
  onSave,
}: Pick<Props, 'draft' | 'canEdit' | 'saving' | 'onChange' | 'onSave'>) {
  return (
    <div className="tx-footer">
      <label className="tx-publish">
        <input
          type="checkbox"
          checked={draft.published}
          disabled={!canEdit}
          onChange={(e) => onChange({ ...draft, published: e.target.checked })}
        />
        <span>
          <span className="tx-publish__label">Show this to shoppers</span>
          <span className="tx-publish__hint">
            Unpublished stays private. Publishing projects to the product page and search.
          </span>
        </span>
      </label>
      {canEdit ? (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="tx-btn tx-btn--primary"
        >
          {saving ? 'Saving…' : draft.disclosureId != null ? 'Save changes' : 'Save'}
        </button>
      ) : null}
    </div>
  )
}
