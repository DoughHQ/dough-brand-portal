import type { Brand } from '@/lib/queries'
import type { BrandProfileState } from './useBrandProfile'

export function BrandProfileAbout({
  brand,
  profile,
  editing,
  setEditing,
  editingProfile,
  aboutDraft,
  setAboutDraft,
  saving,
  setSaveError,
  saveAbout,
}: { brand: Brand } & Pick<
  BrandProfileState,
  | 'profile'
  | 'editing'
  | 'setEditing'
  | 'editingProfile'
  | 'aboutDraft'
  | 'setAboutDraft'
  | 'saving'
  | 'setSaveError'
  | 'saveAbout'
>) {
  return editingProfile && editing === 'about' ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
      <textarea
        autoFocus
        value={aboutDraft}
        onChange={(e) => setAboutDraft(e.target.value)}
        placeholder={`Tell people a little about ${brand.brand_name}`}
        rows={3}
        className="bp-about-input"
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => void saveAbout()}
          disabled={saving}
          className="bp-save"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setAboutDraft(profile.about_text)
            setSaveError(null)
          }}
          className="bp-cancel"
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <p className={`bp-desc${profile.about_text ? '' : ' is-empty'}`}>
      {profile.about_text || `Tell people a little about ${brand.brand_name}`}
    </p>
  )
}
