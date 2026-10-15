import { useRef } from 'react'
import type { ProductMasterWrites } from '../tabs/useProductMasterWrites'

export function ProductImageFileInput({
  uploading,
  hasPrimaryImage,
  uploadImage,
}: {
  uploading: boolean
  hasPrimaryImage: boolean
  uploadImage: ProductMasterWrites['uploadImage']
}) {
  const imageFileRef = useRef<HTMLInputElement>(null)
  return (
    <input
      id="pm-product-image-file"
      ref={imageFileRef}
      className="pm-hero-file"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      disabled={uploading}
      onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) {
          void uploadImage(f, { makePrimary: !hasPrimaryImage })
        }
        e.target.value = ''
      }}
    />
  )
}
