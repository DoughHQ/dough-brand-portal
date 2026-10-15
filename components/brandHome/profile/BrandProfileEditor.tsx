import type { Brand } from '@/lib/queries'
import ParentOwnershipField from '@/components/brandHome/ParentOwnershipField'
import { AboutField } from './AboutField'
import { LinkChip } from './LinkChip'
import { LINK_DEFS } from './profileModel'
import type { BrandProfileState } from './useBrandProfile'

export function BrandProfileEditor({
  brand,
  canSubmitOwnershipCorrection,
  profile,
  editing,
  setEditing,
  setAboutDraft,
  setSaveError,
  onSaved,
  closeEditor,
}: { brand: Brand; canSubmitOwnershipCorrection: boolean } & Pick<
  BrandProfileState,
  | 'profile'
  | 'editing'
  | 'setEditing'
  | 'setAboutDraft'
  | 'setSaveError'
  | 'onSaved'
  | 'closeEditor'
>) {
  return (
    <div className="bp-editor">
      {editing !== 'about' ? (
        <button
          type="button"
          className="bp-edit"
          onClick={() => {
            setAboutDraft(profile.about_text)
            setEditing('about')
            setSaveError(null)
          }}
        >
          {profile.about_text ? 'Edit description' : 'Add a brand description'}
        </button>
      ) : null}

      <div className="bp-editor-links">
        {LINK_DEFS.map((def) => (
          <LinkChip
            key={def.key}
            linkKey={def.key}
            label={def.label}
            stored={profile[def.key]}
            placeholder={def.placeholder}
            onSaved={onSaved}
            onError={(m) => setSaveError(m || null)}
          />
        ))}
      </div>

      <div className="bp-editor-about">
        <AboutField
          label="City"
          value={profile.headquarters_city}
          placeholder="New York"
          field="headquarters_city"
          onSaved={onSaved}
          onError={(m) => setSaveError(m || null)}
        />
        <AboutField
          label="State"
          value={profile.headquarters_state}
          placeholder="NY"
          field="headquarters_state"
          width={80}
          onSaved={onSaved}
          onError={(m) => setSaveError(m || null)}
        />
        <AboutField
          label="Founded"
          value={profile.founded_year}
          placeholder="2008"
          field="founded_year"
          width={80}
          onSaved={onSaved}
          onError={(m) => setSaveError(m || null)}
        />
        <ParentOwnershipField
          brandName={brand.brand_name}
          canSubmitCorrection={canSubmitOwnershipCorrection}
          variant="editor"
        />
      </div>

      <button type="button" className="bp-edit" onClick={closeEditor}>
        Done
      </button>
    </div>
  )
}
