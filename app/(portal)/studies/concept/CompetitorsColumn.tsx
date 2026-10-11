'use client'

import type { PricePosture, ProductCompetitorRow } from '@/lib/concept/types'
import type { AddAvailability } from '@/lib/concept/fieldSize'
import CompetitorColumnHead from './competitors/CompetitorColumnHead'
import CompetitorEmptyState from './competitors/CompetitorEmptyState'
import CompetitorSearchSlot from './competitors/CompetitorSearchSlot'
import SelectedCompetitor from './competitors/SelectedCompetitor'
import { useCompetitorColumn } from './competitors/useCompetitorColumn'

/**
 * Section 1 · right column — "Competitors".
 *
 * The persistent object is the competitive set. Product search is temporary tooling
 * used to add or replace one member of that set, and collapses once it has done its job.
 *
 * Backend semantics preserved exactly: a competitor is only ever a row resolved from
 * `search_products_admin`, snapshotted into frozen_* fields. A row with `product_id: null`
 * is an unfinished slot — it is never published and still blocks publish via the existing
 * `productIntentsOk` rule, exactly as before.
 */

type Props = {
  products: ProductCompetitorRow[]
  onProductsChange: (next: ProductCompetitorRow[]) => void
  /** Standalone price study — validity requires at least one real competitor. */
  priceMode: boolean
  /** Packaging / price force blind: no per-competitor price in those modes. */
  hidePrice: boolean
  pricePosture: PricePosture
  /** Authoritative field-capacity verdict — owned by lib/concept/fieldSize. */
  addCompetitor: AddAvailability
  /** Authoritative mode-aware progress copy — owned by lib/concept/fieldSize. */
  progressLabel: string
  disabled?: boolean
  /** localId → inline UPC / duplicate error on the competitor card. */
  rowErrors?: Record<string, string>
  singleTestMode?: boolean
}

export default function CompetitorsColumn({
  products,
  onProductsChange,
  priceMode,
  hidePrice,
  pricePosture,
  addCompetitor: addAvailability,
  progressLabel,
  disabled,
  rowErrors = {},
  singleTestMode = false,
}: Props) {
  const column = useCompetitorColumn({
    products,
    onProductsChange,
    addAvailability,
    disabled,
  })
  const showAdd = products.length > 0 || column.adding

  return (
    <>
      <CompetitorColumnHead
        singleTestMode={singleTestMode}
        showAdd={showAdd}
        adding={column.adding}
        disabled={disabled}
        addAvailability={addAvailability}
        progressLabel={progressLabel}
        onOpenAdd={column.openAdd}
      />

      <div className="cb-field-body-right">
        {products.length === 0 && !column.adding ? (
          <CompetitorEmptyState
            disabled={disabled}
            addAvailability={addAvailability}
            onOpenAdd={column.openAdd}
          />
        ) : (
          <div className="cb-comp-list">
            {products.map((row) =>
              row.product_id != null ? (
                <SelectedCompetitor
                  key={row.localId}
                  row={row}
                  hidePrice={hidePrice}
                  showMarketPrice={priceMode}
                  pricePosture={pricePosture}
                  error={rowErrors[row.localId]}
                  onChangeRow={(next) => column.patchRow(row.localId, next)}
                  onPatch={(patch) =>
                    column.patchRow(row.localId, { ...row, ...patch })
                  }
                  onReplace={() => column.beginChange(row)}
                  onRemove={() => column.removeRow(row.localId)}
                  singleTestMode={singleTestMode}
                />
              ) : (
                <CompetitorSearchSlot
                  key={row.localId}
                  isReplace={column.changing?.localId === row.localId}
                  taken={column.taken}
                  onPick={(p, upc) => column.pick(row, p, upc)}
                  onCancel={() => column.cancelSlot(row)}
                />
              )
            )}
            {column.adding ? (
              <CompetitorSearchSlot
                key="transient-add"
                isReplace={false}
                taken={column.taken}
                onPick={(p, upc) => column.addResolved(p, upc)}
                onCancel={() => column.setAdding(false)}
              />
            ) : null}
          </div>
        )}
      </div>
    </>
  )
}
