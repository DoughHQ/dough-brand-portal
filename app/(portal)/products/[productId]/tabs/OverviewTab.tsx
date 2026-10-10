'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import WhereItsSoldSection from '@/components/distribution/WhereItsSoldSection'
import { ComingSoonStub } from '@/components/productMaster/ComingSoonStub'
import {
  button,
  caption,
  consumerQuestion,
  inputStyle as masterInput,
} from '@/lib/productMaster/styles'
import { skuLabel } from '@/lib/productMaster/format'
import {
  IDENTITY_LABELS,
  catalogCorrectionHref,
} from '@/lib/productMaster/pendingCorrections'
import type { ProductMaster } from '@/lib/productMaster/types'
import { ProductOverviewTab } from './ProductDetailTabPanels'
import { IdentityField } from './IdentityField'
import {
  CategoryBreadcrumb,
  OverviewHeading,
  ProposalBadge,
} from './productMasterBits'
import type { ProductMasterWrites } from './useProductMasterWrites'

const muted: CSSProperties = { ...caption }
const secondaryBtn: CSSProperties = { ...button }
const inputStyle: CSSProperties = { ...masterInput }

export function OverviewTab({
  master,
  writes,
  canEdit,
  isAdmin,
}: {
  master: ProductMaster
  writes: ProductMasterWrites
  canEdit: boolean
  isAdmin: boolean
}) {
  const product = master.product
  const {
    pendingFields,
    proposalByField,
    systemFlags,
    editable,
    editingField,
    draft,
    setDraft,
    setEditingField,
    saving,
    categoryOpen,
    setCategoryOpen,
    competitorQuery,
    competitorHits,
    competitors,
    setCompetitors,
    searchCompetitors,
    startEditIdentity,
    priorForField,
    saveIdentity,
  } = writes

  return (
    <ProductOverviewTab>
      {/* Identity */}
      <div
        className={`pm-overview-card${pendingFields.has('name') ? ' pm-overview-card-pending' : ''}`}
      >
        <OverviewHeading>
          Identity
          <ProposalBadge types={pendingFields} match="name" />
        </OverviewHeading>
        <div className="pm-id-rows">
          {(['product_name_short', 'product_flavor_variant', 'product_variety', 'product_description'] as const).map(
            (field) => (
              <IdentityField
                key={field}
                label={IDENTITY_LABELS[field]}
                field={field}
                value={product[field]}
                editing={editingField === field}
                draft={draft}
                canEdit={canEdit && editable.has(field)}
                prior={priorForField(field)}
                pending={false}
                onStart={() => startEditIdentity(field, product[field])}
                onDraft={setDraft}
                onSave={() => saveIdentity(field, draft)}
                onCancel={() => setEditingField(null)}
                saving={saving}
                multiline={field === 'product_description'}
                compact
              />
            )
          )}
        </div>
      </div>
      {/* Category */}
      <div
        className={`pm-overview-card${pendingFields.has('category') ? ' pm-overview-card-pending' : ''}`}
      >
        <OverviewHeading>
          Category
          <ProposalBadge types={pendingFields} match="category" />
        </OverviewHeading>
        <CategoryBreadcrumb path={product.category_path} />
        <span className="pm-overview-locked" title="Shared field">
          Locked
        </span>
        {(proposalByField.get('category') || systemFlags[0]) && (
          <div style={{ ...caption, marginTop: 6, color: 'var(--amber)' }}>
            {(proposalByField.get('category') ?? systemFlags[0])!.summary}
          </div>
        )}
        {product.l3_confidence_score != null && (
          <p className="pm-overview-meta">
            Confidence {Math.round(Number(product.l3_confidence_score) * 100)}%
            {isAdmin && product.l3_source ? ` · ${product.l3_source}` : ''}
          </p>
        )}
        <p className="pm-overview-blurb">
          Category decides which products yours battles. Changes are reviewed because other brands
          are measured in the same set.
          {pendingFields.has('category')
            ? isAdmin
              ? ' Approve or assign the category in Corrections — not on this page.'
              : ' Dough is reviewing the category. Follow it in Corrections.'
            : ''}
        </p>
        {pendingFields.has('category') && (
          <Link
            href={catalogCorrectionHref(
              isAdmin,
              (proposalByField.get('category') ?? systemFlags[0])?.id
            )}
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
            {isAdmin ? 'Review category in Corrections →' : 'Follow category in Corrections →'}
          </Link>
        )}
        {canEdit && (
          <div className="pm-overview-cat-action">
            {!categoryOpen ? (
              <button
                type="button"
                onClick={() => setCategoryOpen(true)}
                className="pm-overview-quiet-btn"
              >
                Request a category change
              </button>
            ) : (
              <div
                style={{
                  marginTop: 8,
                  padding: 16,
                  background: 'var(--surface)',
                  borderRadius: 8,
                  border: '1px solid var(--ink-10)',
                }}
              >
                <p style={{ ...consumerQuestion, margin: '0 0 12px' }}>
                  &ldquo;When someone reaches for your product instead of something else — what&apos;s
                  the something else?&rdquo;
                </p>
                <input
                  value={competitorQuery}
                  onChange={(e) => void searchCompetitors(e.target.value)}
                  placeholder="Search products…"
                  style={inputStyle}
                />
                {competitorHits.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
                    {competitorHits.map((h) => (
                      <li key={h.product_id}>
                        <button
                          type="button"
                          disabled={competitors.length >= 5 || competitors.some((c) => c.product_id === h.product_id)}
                          onClick={() => {
                            if (competitors.length >= 5) return
                            setCompetitors((prev) => [...prev, h])
                          }}
                          style={{
                            ...secondaryBtn,
                            width: '100%',
                            textAlign: 'left',
                            marginBottom: 4,
                            border: 'none',
                            background: 'transparent',
                          }}
                        >
                          {h.product_name_display}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {competitors.map((c) => (
                    <span
                      key={c.product_id}
                      style={{
                        fontSize: 13,
                        background: 'var(--paper)',
                        border: '1px solid var(--ink-10)',
                        borderRadius: 4,
                        padding: '4px 8px',
                      }}
                    >
                      {c.product_name_display}
                      <button
                        type="button"
                        onClick={() =>
                          setCompetitors((prev) => prev.filter((x) => x.product_id !== c.product_id))
                        }
                        style={{ marginLeft: 6, border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p style={{ ...muted, marginBottom: 8 }}>Select 3–5 competitors.</p>
                <ComingSoonStub
                  label="Submit request"
                  subject={`Category change request — product ${product.product_id}`}
                />
                <button
                  type="button"
                  onClick={() => setCategoryOpen(false)}
                  style={{ ...secondaryBtn, marginLeft: 8, marginTop: 8 }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Compete */}
      <div className="pm-overview-card pm-overview-compete">
        <OverviewHeading>Where this product competes</OverviewHeading>
        {(master.compare_groups.eligible?.length ?? 0) === 0 ? (
          <p style={caption}>No compare groups on file for this category yet.</p>
        ) : (
          <div className="pm-compete-groups">
            {master.compare_groups.eligible.map((g) => {
              const question = g.consumer_question
              const setName = g.name && g.name !== question ? g.name : null
              const split = Boolean(question && setName)
              return (
                <div key={g.compare_group_id}>
                  <div className={`pm-compete-row${split ? '' : ' pm-compete-row-solo'}`}>
                    <div className="pm-compete-question">
                      {question ? (
                        <p>&ldquo;{question}&rdquo;</p>
                      ) : (
                        <p>{g.name}</p>
                      )}
                    </div>
                    {split ? <div className="pm-compete-set">{setName}</div> : null}
                  </div>
                  {g.has_results && (
                    <div className="pm-compete-results">Has results</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <WhereItsSoldSection
        productId={product.product_id}
        productTitle={product.product_name_display}
        canEdit={canEdit}
        skus={master.skus.map((s) => ({
          sku_variant_id: s.sku_variant_id,
          label: skuLabel(s),
        }))}
      />
    </ProductOverviewTab>
  )
}
