import type { Brand } from '@/lib/queries'
import ParentOwnershipField from '@/components/brandHome/ParentOwnershipField'
import { LocationIcon } from './LocationIcon'
import { PresenceLink } from './PresenceLink'
import type { BrandProfileState } from './useBrandProfile'

export function BrandProfileSummary({
  brand,
  canEdit,
  locationLine,
  featured,
  hidden,
  linkValues,
  profilesOpen,
  setProfilesOpen,
  openEditor,
}: { brand: Brand; canEdit: boolean } & Pick<
  BrandProfileState,
  | 'locationLine'
  | 'featured'
  | 'hidden'
  | 'linkValues'
  | 'profilesOpen'
  | 'setProfilesOpen'
  | 'openEditor'
>) {
  return (
    <>
      <div className="bp-meta">
        {locationLine ? (
          <span className="bp-meta-item">
            <LocationIcon />
            {locationLine}
          </span>
        ) : null}
        {locationLine ? <span className="bp-dot bp-dot-parent" aria-hidden>·</span> : null}
        <ParentOwnershipField
          brandName={brand.brand_name}
          canSubmitCorrection={false}
          variant="summary"
        />
      </div>

      {(featured.length > 0 || hidden.length > 0) ? (
      <div className="bp-presence">
        {featured.map((key, i) => (
          <span key={key} className="bp-presence-group">
            {i > 0 ? <span className="bp-dot" aria-hidden>·</span> : null}
            <PresenceLink linkKey={key} stored={linkValues[key]} />
          </span>
        ))}
        {hidden.length > 0 ? (
          <>
            {featured.length > 0 ? <span className="bp-dot" aria-hidden>·</span> : null}
            <button
              type="button"
              className="bp-expand"
              aria-expanded={profilesOpen}
              onClick={() => setProfilesOpen((open) => !open)}
            >
              {profilesOpen
                ? 'Hide profiles'
                : `+${hidden.length} profile${hidden.length === 1 ? '' : 's'}`}
            </button>
          </>
        ) : null}
      </div>
      ) : null}

      {profilesOpen && hidden.length > 0 ? (
        <div className="bp-presence bp-presence-more">
          {hidden.map((key, i) => (
            <span key={key} className="bp-presence-group">
              {i > 0 ? <span className="bp-dot" aria-hidden>·</span> : null}
              <PresenceLink linkKey={key} stored={linkValues[key]} />
            </span>
          ))}
        </div>
      ) : null}

      {canEdit ? (
        <button type="button" className="bp-edit" onClick={openEditor}>
          Edit brand profile →
        </button>
      ) : null}
    </>
  )
}
