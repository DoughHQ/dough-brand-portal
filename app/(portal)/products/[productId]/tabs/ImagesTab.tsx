'use client'

import type { CSSProperties } from 'react'
import { EvidenceRungChip } from '@/components/productMaster/EvidenceRungChip'
import { button, panel, panelPending } from '@/lib/productMaster/styles'
import type { ProductMaster } from '@/lib/productMaster/types'
import { ProductImagesTab } from './ProductDetailTabPanels'
import { ProposalBadge, SectionHeading } from './productMasterBits'
import type { ProductMasterWrites } from './useProductMasterWrites'

const secondaryBtn: CSSProperties = { ...button }

function pendingPanelStyle(active: boolean): CSSProperties {
  return active ? panelPending : panel
}

export function ImagesTab({
  master,
  writes,
  canEdit,
}: {
  master: ProductMaster
  writes: ProductMasterWrites
  canEdit: boolean
}) {
  const { pendingFields, uploading, promoteImage } = writes

  return (
    <ProductImagesTab>
      {/* Images */}
      <div style={pendingPanelStyle(pendingFields.has('images'))}>
        {/* Images */}
        <SectionHeading>
          Images
          <ProposalBadge types={pendingFields} match="images" />
        </SectionHeading>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          {master.images.map((img) => (
            <div key={img.product_image_id} style={{ width: 100, textAlign: 'center' }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  background: 'var(--surface)',
                  overflow: 'hidden',
                  opacity: img.superseded_by_id ? 0.55 : 1,
                  border: img.is_primary ? '2px solid var(--sage)' : '1px solid var(--ink-10)',
                }}
              >
                {img.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.public_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : null}
              </div>
              <div style={{ marginTop: 4 }}>
                <EvidenceRungChip rung={img.evidence_rung} />
              </div>
              {img.is_primary ? (
                <div style={{ fontSize: 13, color: 'var(--sage)', marginTop: 2 }}>Primary</div>
              ) : (
                canEdit &&
                !img.superseded_by_id && (
                  <button
                    type="button"
                    onClick={() => void promoteImage(img.product_image_id)}
                    style={{ ...secondaryBtn, fontSize: 13, padding: '2px 6px', marginTop: 4 }}
                  >
                    Make primary
                  </button>
                )
              )}
              {img.superseded_by_id && (
                <div style={{ fontSize: 13, color: 'var(--ink-30)' }}>History</div>
              )}
            </div>
          ))}
        </div>
        {canEdit && (
          <label
            htmlFor="pm-product-image-file"
            style={{
              ...secondaryBtn,
              display: 'inline-block',
              cursor: uploading ? 'wait' : 'pointer',
              opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? 'Uploading…' : 'Upload image'}
          </label>
        )}
      </div>
    </ProductImagesTab>
  )
}
