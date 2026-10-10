'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  bodyText,
  button,
  caption,
  panel,
} from '@/lib/productMaster/styles'
import { formatMoney } from '@/lib/productMaster/format'
import {
  catalogCorrectionHref,
  proposalHeadline,
  systemFlagTitle,
  CORRECTION_FIELD,
} from '@/lib/productMaster/pendingCorrections'
import type { OpenCorrection, ProductMaster } from '@/lib/productMaster/types'
import { displayAllCapsPhrase } from './compositionPresentation'
import { skuLabel } from '@/lib/productMaster/format'
import ProductSkuSwitcher from './ProductSkuSwitcher'
import { IdentityField } from './IdentityField'
import { ProposalBadge } from './productMasterBits'
import type { ProductMasterWrites } from './useProductMasterWrites'
import type { ProductDetailTab } from './productDetailTabs'
import type { ProductStudyCard } from '@/lib/productMaster/productHeroStudies'
import ProductDetailTabBar from './ProductDetailTabBar'

export function ProductMasterHero({
  master,
  writes,
  canEdit,
  isAdmin,
  selectedSkuId,
  tab,
  studies,
  proofAskCount,
  flash,
  errorMsg,
  stalePanel,
  onSelectSku,
  onSelectTab,
}: {
  master: ProductMaster
  writes: ProductMasterWrites
  canEdit: boolean
  isAdmin: boolean
  selectedSkuId: number | null
  tab: ProductDetailTab
  studies: ProductStudyCard[]
  proofAskCount: number
  flash: string | null
  errorMsg: string | null
  stalePanel: ReactNode
  onSelectSku: (id: number) => void
  onSelectTab: (tab: ProductDetailTab) => void
}) {
  const product = master.product
  const {
    systemFlags,
    proposals,
    pendingFields,
    proposalByField,
    editable,
    editingField,
    draft,
    setDraft,
    setEditingField,
    saving,
    uploading,
    startEditIdentity,
    priorForField,
    saveIdentity,
  } = writes
  const selectedSku =
    master.skus.find((s) => s.sku_variant_id === selectedSkuId) ?? master.skus[0] ?? null

  return (
    <>
      <Link
        href="/products"
        style={{
          display: 'inline-flex',
          fontSize: 13,
          color: 'var(--ink-50)',
          marginBottom: 20,
          textDecoration: 'none',
        }}
      >
        ← Products
      </Link>

      {systemFlags.map((c) => (
        <SystemFlagBanner key={c.id} c={c} isAdmin={isAdmin} />
      ))}
      {proposals.map((c) => (
        <ProposalBanner key={c.id} c={c} isAdmin={isAdmin} />
      ))}

      {flash && (
        <div style={{ ...caption, marginBottom: 12, color: 'var(--sage)' }}>{flash}</div>
      )}
      {errorMsg && (
        <div style={{ ...caption, marginBottom: 12, color: 'var(--clay, #a6543c)' }}>{errorMsg}</div>
      )}
      {stalePanel}

      {/* Hero */}
      <div
        className="pm-hero"
        style={{
          ...panel,
          display: 'grid',
          gridTemplateColumns: 'minmax(160px, 220px) minmax(0, 1fr)',
          gap: 28,
          alignItems: 'center',
          marginBottom: 20,
          padding: '28px 32px',
        }}
      >
        {canEdit && !product.primary_image_url ? (
          <label
            htmlFor="pm-product-image-file"
            className={`pm-hero-art is-empty${uploading ? ' is-busy' : ''}`}
            aria-label={uploading ? 'Uploading pack shot' : 'Add pack shot'}
          >
            <span className="pm-hero-art-letter" aria-hidden>
              {(product.product_name_display ?? '?')[0]?.toUpperCase() ?? '?'}
            </span>
            <span className="pm-hero-art-cta">
              {uploading ? 'Uploading…' : 'Add pack shot'}
            </span>
          </label>
        ) : canEdit && product.primary_image_url ? (
          <button
            type="button"
            className={`pm-hero-art${uploading ? ' is-busy' : ''}`}
            onClick={() => onSelectTab('images')}
            disabled={uploading}
            aria-label="Manage product images"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.primary_image_url} alt="" className="pm-hero-art-img" />
            <span className="pm-hero-art-hover">Manage images</span>
          </button>
        ) : (
          <div className={`pm-hero-art${product.primary_image_url ? '' : ' is-empty'} is-static`}>
            {product.primary_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.primary_image_url} alt="" className="pm-hero-art-img" />
            ) : (
              <span className="pm-hero-art-letter" aria-hidden>
                {(product.product_name_display ?? '?')[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ ...caption, marginBottom: 10 }}>
            {product.category_path ?? 'Not yet categorized'}
            <ProposalBadge types={pendingFields} match="category" />
          </div>
          <IdentityField
            label="Display name"
            field="product_name_display"
            value={product.product_name_display}
            editing={editingField === 'product_name_display'}
            draft={draft}
            canEdit={canEdit && editable.has('product_name_display')}
            prior={priorForField('product_name_display')}
            pending={pendingFields.has('name')}
            onStart={() => startEditIdentity('product_name_display', product.product_name_display)}
            onDraft={setDraft}
            onSave={() => saveIdentity('product_name_display', draft)}
            onCancel={() => setEditingField(null)}
            saving={saving}
            large
          />
          <div
            style={{
              ...bodyText,
              marginTop: 10,
              color: 'var(--ink-muted, rgba(28,38,32,0.55))',
              ...(pendingFields.has('brand')
                ? {
                    padding: '8px 10px',
                    marginLeft: -10,
                    borderRadius: 8,
                    background: 'var(--amber-soft, rgba(192,120,24,0.08))',
                    border: '1px solid rgba(192,120,24,0.28)',
                  }
                : {}),
            }}
          >
            <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{product.brand_name}</span>
            <span title="Brand reassigns ownership"> · locked</span>
            <ProposalBadge types={pendingFields} match="brand" />
            {proposalByField.get('brand') && (
              <div style={{ ...caption, marginTop: 6, color: 'var(--amber)' }}>
                {proposalByField.get('brand')!.summary}
              </div>
            )}
          </div>
          {master.sku_count > 0 && (
            <div style={{ ...caption, marginTop: 10 }}>
              {master.sku_count} SKU{master.sku_count === 1 ? '' : 's'}
              {master.price?.msrp != null ? ` · MSRP ${formatMoney(master.price.msrp)}` : ''}
              {master.price?.price_tier ? ` · ${master.price.price_tier}` : ''}
            </div>
          )}
        </div>
      </div>

      <ProductSkuSwitcher
        options={master.skus.map((sku) => ({
          id: sku.sku_variant_id,
          label: displayAllCapsPhrase(skuLabel(sku)),
          barcode: sku.barcode,
        }))}
        selectedId={selectedSku?.sku_variant_id ?? null}
        canEdit={canEdit}
        addSubject={`Add SKU — product ${product.product_id}`}
        onSelect={onSelectSku}
      />

      <ProductDetailTabBar
        active={tab}
        packageCount={master.sku_count}
        studyCount={studies.length}
        proofAskCount={proofAskCount}
        onSelect={onSelectTab}
      />
    </>
  )
}

function SystemFlagBanner({ c, isAdmin }: { c: OpenCorrection; isAdmin: boolean }) {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: '14px 16px',
        borderRadius: 8,
        background: 'var(--surface)',
        border: '1px solid var(--ink-10)',
      }}
    >
      <div style={{ ...bodyText, fontWeight: 500, marginBottom: 6 }}>{systemFlagTitle(c)}</div>
      <div style={{ ...bodyText, color: 'var(--ink-muted, rgba(28,38,32,0.55))' }}>
        {c.summary}
      </div>
      <div style={{ ...caption, marginTop: 8 }}>
        Category is highlighted below.
        {!isAdmin && ' Follow it in Corrections — Dough is reviewing it.'}
        {isAdmin && ' Assign or confirm the category in Corrections.'}
      </div>
      <Link
        href={catalogCorrectionHref(isAdmin, c.id)}
        style={{
          ...button,
          display: 'inline-flex',
          marginTop: 12,
          textDecoration: 'none',
          background: 'var(--sage)',
          borderColor: 'var(--sage)',
          color: 'var(--on-fill, #fff)',
        }}
      >
        {isAdmin ? 'Review in Corrections →' : 'Follow in Corrections →'}
      </Link>
    </div>
  )
}

function ProposalBanner({ c, isAdmin }: { c: OpenCorrection; isAdmin: boolean }) {
  const fieldKey = CORRECTION_FIELD[c.correction_type] ?? 'other'
  return (
    <div
      style={{
        marginBottom: 16,
        padding: '14px 16px',
        borderRadius: 8,
        border: '1px solid rgba(192,120,24,0.25)',
        background: 'var(--amber-soft, rgba(192,120,24,0.08))',
      }}
    >
      <div style={{ ...bodyText, fontWeight: 500, marginBottom: 6, color: 'var(--amber)' }}>
        {proposalHeadline(c)}
      </div>
      <div style={{ ...caption }}>
        The {fieldKey === 'other' ? 'related' : fieldKey} field is highlighted on this page.
        {!isAdmin && ' Dough reviews shared fields before they go live. Follow it in Corrections.'}
      </div>
      <Link
        href={catalogCorrectionHref(isAdmin, c.id)}
        style={{
          ...button,
          display: 'inline-flex',
          marginTop: 12,
          textDecoration: 'none',
          background: 'var(--sage)',
          borderColor: 'var(--sage)',
          color: 'var(--on-fill, #fff)',
        }}
      >
        {isAdmin ? 'Review in Corrections →' : 'Follow in Corrections →'}
      </Link>
    </div>
  )
}
