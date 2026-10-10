'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { coordFromRow, parseCoord, serializeCoord } from '@/lib/distribution/coords'
import CoordCard from './whereItsSold/CoordCard'
import SeedSection from './whereItsSold/SeedSection'
import useWhereItsSold from './whereItsSold/useWhereItsSold'
import AddPlaceModal from './whereItsSold/modals/AddPlaceModal'
import ClaimAllModal from './whereItsSold/modals/ClaimAllModal'
import DelistModal from './whereItsSold/modals/DelistModal'
import DisputeModal from './whereItsSold/modals/DisputeModal'
import NationwideConfirmModal from './whereItsSold/modals/NationwideConfirmModal'
import type { Props } from './whereItsSold/types'
import './whereItsSold.css'

export default function WhereItsSoldSection({
  productId,
  productTitle,
  canEdit,
  skus,
}: Props) {
  const searchParams = useSearchParams()
  const focusCoord = useMemo(
    () => parseCoord(searchParams.get('coord')),
    [searchParams],
  )
  const model = useWhereItsSold(productId, focusCoord)
  const {
    capability,
    rows,
    reports,
    loading,
    error,
    busy,
    toast,
    modal,
    setModal,
    bannerQuery,
    setBannerQuery,
    seedsOpen,
    setSeedsOpen,
    sections,
    claimable,
    seedPeek,
    showFilter,
    needsCount,
    runDeclare,
    onClaimAll,
    onDelist,
    onDispute,
    cardHandlers,
  } = model

  const multiVariant = skus.length > 1
  const allowed = capability?.allowed === true
  const refused = capability != null && !capability.allowed

  return (
    <div
      className="pm-overview-card pm-overview-compete wis-section"
      id="where-its-sold"
    >
      <div className="wis-header">
        <div>
          <h2 className="pm-overview-heading" style={{ marginBottom: 4 }}>
            Where it&apos;s sold
            {!loading && !refused && needsCount > 0 ? (
              <span className="wis-heading-count">
                {' '}
                · {needsCount} need review
              </span>
            ) : null}
          </h2>
          {!refused ? (
            <>
              <p className="wis-lede">
                Authorised to be carried — not whether it is on the shelf right
                now.
              </p>
              <p className="wis-coming">
                We use this to show shoppers where to find your product. That
                surface is coming soon.
              </p>
            </>
          ) : null}
        </div>
        {canEdit && allowed ? (
          <button
            type="button"
            className="wis-btn wis-btn--primary"
            onClick={() => setModal({ kind: 'add' })}
          >
            Add a place
          </button>
        ) : null}
      </div>

      {toast ? <div className="wis-toast">{toast}</div> : null}
      {error ? <div className="wis-error">{error}</div> : null}

      {loading ? (
        <p className="wis-lede">Loading distribution…</p>
      ) : refused ? (
        <p className="wis-refused">
          {capability?.reasonMessage ??
            'We need to confirm who owns this product before you can add distribution.'}
        </p>
      ) : rows.length === 0 ? (
        <div className="wis-empty">
          <h3>We don&apos;t know where this is sold yet.</h3>
          <p>
            Add the retailers that carry it, and we&apos;ll show it to shoppers
            looking for it near them.
          </p>
          {canEdit ? (
            <button
              type="button"
              className="wis-btn wis-btn--primary"
              onClick={() => setModal({ kind: 'add' })}
            >
              Add a place
            </button>
          ) : null}
        </div>
      ) : (
        <>
          {showFilter ? (
            <div className="wis-filter">
              <input
                type="search"
                placeholder="Filter by banner or region…"
                value={bannerQuery}
                onChange={(event) => setBannerQuery(event.target.value)}
                aria-label="Filter distribution by banner"
              />
            </div>
          ) : null}

          <div className="wis-sections">
            {sections.map((section) => {
              if (section.rows.length === 0) return null
              if (section.id === 'dough_seeds') {
                return (
                  <SeedSection
                    key={section.id}
                    section={section}
                    peek={seedPeek}
                    open={seedsOpen}
                    onToggle={() => setSeedsOpen((value) => !value)}
                    claimable={claimable}
                    canEdit={canEdit}
                    busy={busy}
                    allRows={rows}
                    reports={reports}
                    productTitle={productTitle}
                    focusCoord={focusCoord}
                    onClaimAll={() =>
                      setModal({ kind: 'claim-all', seeds: claimable })
                    }
                    {...cardHandlers}
                  />
                )
              }
              return (
                <section
                  key={section.id}
                  className={`wis-bucket wis-bucket--${section.id}`}
                  aria-labelledby={`wis-${section.id}`}
                >
                  <div className="wis-bucket-head">
                    <h3
                      id={`wis-${section.id}`}
                      className="wis-bucket-title"
                    >
                      {section.title}
                      <span className="wis-bucket-count">
                        {section.rows.length}
                      </span>
                    </h3>
                  </div>
                  <div className="wis-bucket-body">
                    {section.rows.map((row) => {
                      const key = serializeCoord(coordFromRow(row))
                      const focused =
                        focusCoord != null &&
                        serializeCoord(focusCoord) === key
                      return (
                        <CoordCard
                          key={key}
                          row={row}
                          allRows={rows}
                          reports={reports}
                          productTitle={productTitle}
                          canEdit={canEdit}
                          busy={busy}
                          focused={focused}
                          {...cardHandlers}
                        />
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}

      {modal?.kind === 'add' ? (
        <AddPlaceModal
          multiVariant={multiVariant}
          skus={skus}
          prefill={modal.prefill}
          rows={rows}
          busy={busy != null}
          onClose={() => setModal(null)}
          onSubmit={(pending) => {
            if (pending.scopeLevel === 'national') {
              setModal({
                kind: 'nationwide-confirm',
                pending,
                returnToAdd: true,
              })
              return
            }
            void runDeclare(pending)
          }}
        />
      ) : null}

      {modal?.kind === 'nationwide-confirm' ? (
        <NationwideConfirmModal
          pending={modal.pending}
          busy={busy != null}
          onCancel={() =>
            setModal(
              modal.returnToAdd
                ? { kind: 'add', prefill: undefined }
                : null,
            )
          }
          onConfirm={() => void runDeclare(modal.pending)}
        />
      ) : null}

      {modal?.kind === 'claim-all' ? (
        <ClaimAllModal
          seeds={modal.seeds}
          busy={busy != null}
          onClose={() => setModal(null)}
          onConfirm={() => void onClaimAll(modal.seeds)}
        />
      ) : null}

      {modal?.kind === 'delist' ? (
        <DelistModal
          coveredByNational={modal.coveredByNational}
          busy={busy != null}
          onClose={() => setModal(null)}
          onSubmit={(date) => void onDelist(modal.declarationId, date)}
        />
      ) : null}

      {modal?.kind === 'dispute' ? (
        <DisputeModal
          place={`${modal.retailerName} · ${modal.scopeLabel}`}
          busy={busy != null}
          onClose={() => setModal(null)}
          onSubmit={(note) => void onDispute(modal.coord, note)}
        />
      ) : null}
    </div>
  )
}
