import type { BoxFieldRow, BoxSeatRole } from '@/lib/box/types'
import type { PrototypePackaging } from '@/lib/prototypes/types'
import { BOX_UPC_SCAN_HELP } from '@/lib/box/constants'
import { isIdentityConfirmed } from '@/lib/productEntryMode'
import BoxUpcField from '../BoxUpcField'
import BoxAllergenConfirm from '../BoxAllergenConfirm'
import ProductIdentityConfirm from '../../ProductIdentityConfirm'
import ShelfPriceInput from './ShelfPriceInput'
import type { ComposerIntent } from './types'

export default function ContentsSeatCard({
  row,
  taxonomyNodeId,
  rowError,
  onPatch,
  onOpenComposer,
  onRemove,
}: {
  row: BoxFieldRow
  taxonomyNodeId: number | null
  rowError?: string
  onPatch: (next: BoxFieldRow) => void
  onOpenComposer: (intent: ComposerIntent, row: BoxFieldRow) => void
  onRemove: () => void
}) {
  const isYours = row.role === 'yours'
  const isPrototype = row.kind === 'prototype'
  const differentCategory =
    row.taxonomy_node_id != null &&
    taxonomyNodeId != null &&
    row.taxonomy_node_id !== taxonomyNodeId
  const awaitingConfirm =
    !isPrototype && !!row.upc?.trim() && !isIdentityConfirmed(row)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        border: `1px solid ${rowError ? 'var(--red)' : 'var(--ink-10)'}`,
        borderRadius: 'var(--r-md)',
        padding: 14,
        background: isYours ? 'var(--surface-1)' : 'var(--paper)',
      }}
    >
      {row.frozen_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.frozen_image_url}
          alt=""
          width={72}
          height={72}
          style={{
            width: 72,
            height: 72,
            objectFit: 'contain',
            background: 'var(--surface-1)',
            borderRadius: 10,
            flexShrink: 0,
            border: '1px solid var(--ink-10)',
          }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            width: 72,
            height: 72,
            borderRadius: 10,
            background: 'var(--surface-1)',
            border: '1px solid var(--ink-10)',
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 6,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: isYours ? 'var(--sage)' : 'var(--ink-50)',
              background: isYours ? 'var(--sage-soft)' : 'var(--surface-1)',
              borderRadius: 'var(--cb-radius-pill)',
              padding: '3px 8px',
            }}
          >
            {isYours ? 'Yours' : 'Competitor'}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ink-50)',
              background: 'var(--surface-1)',
              borderRadius: 'var(--cb-radius-pill)',
              padding: '3px 8px',
            }}
          >
            {isPrototype ? 'Prototype' : 'Catalog'}
          </span>
          {differentCategory ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--ink-50)',
                background: 'var(--surface-1)',
                borderRadius: 'var(--cb-radius-pill)',
                padding: '3px 8px',
              }}
            >
              Different category
            </span>
          ) : null}
        </div>
        <div style={{ fontWeight: 600, color: 'var(--ink-80)', fontSize: 15 }}>
          {row.frozen_display_name || 'Unnamed'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 2 }}>
          {isPrototype
            ? [
                row.packaging === 'plain_sample'
                  ? 'Plain sample'
                  : 'Final packaging',
                row.frozen_category,
              ]
                .filter(Boolean)
                .join(' · ')
            : row.frozen_brand_name}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 10,
            alignItems: 'center',
          }}
        >
          <label style={{ fontSize: 12, color: 'var(--ink-50)' }}>
            Role{' '}
            <select
              value={isYours ? 'yours' : 'competitor'}
              onChange={(e) => {
                const role: BoxSeatRole =
                  e.target.value === 'yours' ? 'yours' : 'competitor'
                onPatch({ ...row, role })
              }}
            >
              <option value="yours">Yours</option>
              <option value="competitor">Competitor</option>
            </select>
          </label>
          <button
            type="button"
            className="cb-quiet-action"
            onClick={() =>
              onOpenComposer(
                isPrototype
                  ? 'yours_prototype'
                  : isYours
                    ? 'yours_catalog'
                    : 'competitor_catalog',
                row
              )
            }
          >
            Change
          </button>
          {!isPrototype ? (
            <button
              type="button"
              className="cb-quiet-action"
              onClick={() => onOpenComposer('yours_prototype', row)}
            >
              Use prototype instead
            </button>
          ) : (
            <button
              type="button"
              className="cb-quiet-action"
              onClick={() =>
                onOpenComposer(
                  isYours ? 'yours_catalog' : 'competitor_catalog',
                  row
                )
              }
            >
              Use catalog instead
            </button>
          )}
          <button
            type="button"
            className="cb-quiet-action"
            onClick={onRemove}
            aria-label={`Remove ${row.frozen_display_name || 'seat'}`}
          >
            Remove
          </button>
        </div>

        {isPrototype ? (
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--ink-50)' }}>
              Packaging{' '}
              <select
                value={
                  row.packaging === 'plain_sample'
                    ? 'plain_sample'
                    : 'final_packaging'
                }
                onChange={(e) => {
                  const packaging: PrototypePackaging =
                    e.target.value === 'plain_sample'
                      ? 'plain_sample'
                      : 'final_packaging'
                  onPatch({ ...row, packaging })
                }}
              >
                <option value="final_packaging">Final packaging</option>
                <option value="plain_sample">Plain sample</option>
              </select>
            </label>
            {row.packaging === 'plain_sample' ? (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-50)' }}>
                Plain samples run taste-only — shelf price checks are skipped for the whole box.
              </p>
            ) : (
              <ShelfPriceInput
                value={row.price}
                onChange={(price) => onPatch({ ...row, price })}
              />
            )}
          </div>
        ) : awaitingConfirm && row.upc ? (
          <div style={{ marginTop: 12 }}>
            <ProductIdentityConfirm
              name={row.frozen_display_name}
              brand={row.frozen_brand_name}
              category={row.frozen_category ?? null}
              upc={row.upc}
              help={BOX_UPC_SCAN_HELP}
              onConfirm={() =>
                onPatch({
                  ...row,
                  identityConfirmed: true,
                  allergensContains: null,
                  allergensMayContain: null,
                  allergensConfirmed: false,
                  allergensCatalogStatus: null,
                })
              }
              onChange={() =>
                onOpenComposer(
                  isYours ? 'yours_catalog' : 'competitor_catalog',
                  row
                )
              }
            />
          </div>
        ) : row.product_id != null ? (
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <BoxUpcField
              row={row}
              onSelectUpc={(upc) =>
                onPatch({
                  ...row,
                  upc,
                  identityConfirmed: isYours,
                  allergensContains: null,
                  allergensMayContain: null,
                  allergensConfirmed: false,
                  allergensCatalogStatus: null,
                })
              }
              error={rowError}
            />
            {isIdentityConfirmed(row) && row.upc?.trim() ? (
              <BoxAllergenConfirm row={row} onChange={onPatch} />
            ) : null}
            <ShelfPriceInput
              value={row.price}
              onChange={(price) => onPatch({ ...row, price })}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
