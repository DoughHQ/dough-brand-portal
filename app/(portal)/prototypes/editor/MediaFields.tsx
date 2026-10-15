import PrototypeAllergenDeclare from '../PrototypeAllergenDeclare'
import PrototypeImageUploader from '../PrototypeImageUploader'
import type { PrototypeEditorState } from './usePrototypeEditor'

export function MediaFields({
  brandId,
  pending,
  imagePaths,
  setImagePaths,
  contains,
  setContains,
  mayContain,
  setMayContain,
  allergensDeclared,
  setAllergensDeclared,
}: { brandId: number } & Pick<
  PrototypeEditorState,
  | 'pending'
  | 'imagePaths'
  | 'setImagePaths'
  | 'contains'
  | 'setContains'
  | 'mayContain'
  | 'setMayContain'
  | 'allergensDeclared'
  | 'setAllergensDeclared'
>) {
  return (
    <>
        <div className="proto-field">
          <span className="proto-field-label">Photos</span>
          <PrototypeImageUploader
            brandId={brandId}
            imagePaths={imagePaths}
            disabled={pending}
            onChange={setImagePaths}
          />
        </div>

        <div className="proto-field">
          <span className="proto-field-label">Allergens</span>
          <PrototypeAllergenDeclare
            contains={contains}
            mayContain={mayContain}
            declared={allergensDeclared}
            disabled={pending}
            onChange={({ contains: c, mayContain: m, declared }) => {
              setContains(c)
              setMayContain(m)
              setAllergensDeclared(declared)
            }}
          />
        </div>
    </>
  )
}
