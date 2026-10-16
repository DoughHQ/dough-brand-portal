import type {
  DisclosureDraft,
  ProofSubMetricRow,
  SourceTier,
} from '@/lib/transparency/disclosures'
import { rowPresence } from '@/lib/transparency/proofChapters'
import {
  presenceLabel,
  presencePillClass,
} from '@/lib/transparency/presencePresentation'
import {
  composeKeptLine,
  composeMadeLine,
  provenanceWhisperFromTier,
} from '@/lib/transparency/storyLines'
import ShopperPreview from '@/components/transparency/ShopperPreview'
import type {
  OperationsEditorHandlers,
  OpsLocalRow,
} from '@/components/transparency/operations/types'
import { KeptStoryFields } from './KeptStoryFields'
import { MadeStoryFields } from './MadeStoryFields'

const SOURCE_TIERS: { value: SourceTier; label: string; hint: string }[] = [
  {
    value: 'brand_stated',
    label: 'Brand stated',
    hint: 'Your claim — no document link required.',
  },
  {
    value: 'brand_document',
    label: 'Brand document',
    hint: 'Link to a page, PDF, or report you publish.',
  },
  {
    value: 'third_party_verified',
    label: 'Third-party verified',
    hint: 'Certificate or audit — issuer and URL required.',
  },
]

type Props =
  | {
      kind: 'made'
      canEdit: boolean
      saving: boolean
      error: string | null
      methodField?: ProofSubMetricRow
      paramField?: ProofSubMetricRow
      methodRow?: OpsLocalRow
      paramRow?: OpsLocalRow
      storageField?: undefined
      shelfField?: undefined
      handlingField?: undefined
      storageRow?: undefined
      shelfRow?: undefined
      handlingRow?: undefined
      onChange: OperationsEditorHandlers['onChange']
      onSave: () => void
      onClearError?: () => void
    }
  | {
      kind: 'kept'
      canEdit: boolean
      saving: boolean
      error: string | null
      methodField?: undefined
      paramField?: undefined
      methodRow?: undefined
      paramRow?: undefined
      storageField?: ProofSubMetricRow
      shelfField?: ProofSubMetricRow
      handlingField?: ProofSubMetricRow
      storageRow?: OpsLocalRow
      shelfRow?: OpsLocalRow
      handlingRow?: OpsLocalRow
      onChange: OperationsEditorHandlers['onChange']
      onSave: () => void
      onClearError?: () => void
    }

export default function MadeKeptEditor(props: Props) {
  const anchor =
    props.kind === 'made'
      ? (props.methodRow?.draft ?? props.paramRow?.draft)
      : (props.storageRow?.draft ?? props.shelfRow?.draft ?? props.handlingRow?.draft)

  const preview =
    props.kind === 'made'
      ? composeMadeLine(props.methodRow?.draft.valueText, props.paramRow?.draft.valueText)
      : composeKeptLine(
          props.storageRow?.draft.valueText,
          props.shelfRow?.draft.valueText,
          props.handlingRow?.draft.valueText,
        )

  const patchWhole = (
    field: ProofSubMetricRow,
    row: OpsLocalRow | undefined,
    partial: Partial<DisclosureDraft>,
  ) => {
    if (!row) return
    props.onClearError?.()
    props.onChange(field.sub_metric_code, row.key, {
      ...row.draft,
      status: 'disclosed',
      ...partial,
    })
  }

  const patchSharedMeta = (partial: Partial<DisclosureDraft>) => {
    props.onClearError?.()
    if (props.kind === 'made') {
      if (props.methodField && props.methodRow) {
        patchWhole(props.methodField, props.methodRow, partial)
      }
      if (props.paramField && props.paramRow) {
        patchWhole(props.paramField, props.paramRow, partial)
      }
      return
    }
    if (props.storageField && props.storageRow) {
      patchWhole(props.storageField, props.storageRow, partial)
    }
    if (props.shelfField && props.shelfRow) {
      patchWhole(props.shelfField, props.shelfRow, partial)
    }
    if (props.handlingField && props.handlingRow) {
      patchWhole(props.handlingField, props.handlingRow, partial)
    }
  }

  const presence = rowPresence(anchor ?? null)
  const canSave = Boolean(preview)

  const provClass =
    (anchor?.sourceTier ?? 'brand_stated') === 'third_party_verified'
      ? 'tx-prov tx-prov--verified'
      : (anchor?.sourceTier ?? 'brand_stated') === 'brand_document'
        ? 'tx-prov tx-prov--document'
        : 'tx-prov tx-prov--stated'

  return (
    <div className="tx-ops__card">
      <div className="tx-ops__card-top">
        <span className={presencePillClass(presence)}>{presenceLabel(presence)}</span>
      </div>

      {preview ? (
        <div style={{ marginBottom: 12 }}>
          <ShopperPreview
            line={preview}
            whisper={provenanceWhisperFromTier({
              status: 'disclosed',
              sourceTier: anchor?.sourceTier,
              issuerName: anchor?.issuerName,
            })}
          />
        </div>
      ) : null}

      {props.kind === 'made' ? (
        <MadeStoryFields
          canEdit={props.canEdit}
          methodField={props.methodField}
          paramField={props.paramField}
          methodRow={props.methodRow}
          paramRow={props.paramRow}
          patchWhole={patchWhole}
        />
      ) : (
        <KeptStoryFields
          canEdit={props.canEdit}
          storageField={props.storageField}
          shelfField={props.shelfField}
          handlingField={props.handlingField}
          storageRow={props.storageRow}
          shelfRow={props.shelfRow}
          handlingRow={props.handlingRow}
          patchWhole={patchWhole}
        />
      )}

      <div key={anchor?.sourceTier ?? 'brand_stated'} className={provClass}>
        <p className="tx-prov__eyebrow">Provenance</p>
        <div className="tx-tiers">
          {SOURCE_TIERS.map((tier) => (
            <label
              key={tier.value}
              className={`tx-tier${
                (anchor?.sourceTier ?? 'brand_stated') === tier.value ? ' tx-tier--active' : ''
              }${!props.canEdit ? ' tx-tier--disabled' : ''}`}
            >
              <input
                type="radio"
                name={`ops-${props.kind}-tier`}
                checked={(anchor?.sourceTier ?? 'brand_stated') === tier.value}
                disabled={!props.canEdit}
                onChange={() =>
                  patchSharedMeta({
                    sourceTier: tier.value,
                    sourceUrl: tier.value === 'brand_stated' ? null : (anchor?.sourceUrl ?? null),
                    issuerName:
                      tier.value === 'third_party_verified' ? (anchor?.issuerName ?? null) : null,
                    credentialId:
                      tier.value === 'third_party_verified'
                        ? (anchor?.credentialId ?? null)
                        : null,
                  })
                }
              />
              <span>
                <span className="tx-tier__name">{tier.label}</span>
                <span className="tx-tier__hint">{tier.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {(anchor?.sourceTier ?? 'brand_stated') !== 'brand_stated' ? (
          <div className="tx-field">
            <div className="tx-label">Source URL</div>
            <input
              type="url"
              className="tx-control"
              disabled={!props.canEdit}
              placeholder="https://"
              value={anchor?.sourceUrl ?? ''}
              onChange={(e) => patchSharedMeta({ sourceUrl: e.target.value || null })}
            />
          </div>
        ) : null}
        {(anchor?.sourceTier ?? 'brand_stated') === 'third_party_verified' ? (
          <div className="tx-field">
            <div className="tx-grid tx-grid--2">
              <div>
                <div className="tx-label">Issuer</div>
                <input
                  className="tx-control"
                  disabled={!props.canEdit}
                  value={anchor?.issuerName ?? ''}
                  onChange={(e) => patchSharedMeta({ issuerName: e.target.value || null })}
                />
              </div>
              <div>
                <div className="tx-label">Credential ID</div>
                <input
                  className="tx-control"
                  disabled={!props.canEdit}
                  value={anchor?.credentialId ?? ''}
                  onChange={(e) => patchSharedMeta({ credentialId: e.target.value || null })}
                />
              </div>
            </div>
          </div>
        ) : null}
        <div className="tx-field">
          <div className="tx-label">As of</div>
          <input
            type="date"
            className="tx-control tx-control--date"
            disabled={!props.canEdit}
            value={anchor?.asofDate ?? new Date().toISOString().slice(0, 10)}
            onChange={(e) => patchSharedMeta({ asofDate: e.target.value })}
          />
        </div>
      </div>

      <div className="tx-footer" style={{ marginTop: 0 }}>
        <label className="tx-publish">
          <input
            type="checkbox"
            checked={anchor?.published ?? false}
            disabled={!props.canEdit || !canSave}
            onChange={(e) => patchSharedMeta({ published: e.target.checked })}
          />
          <span>
            <span className="tx-publish__label">Show to shoppers</span>
          </span>
        </label>
        {props.canEdit ? (
          <button
            type="button"
            className="tx-btn tx-btn--primary"
            disabled={props.saving || !canSave}
            onClick={props.onSave}
          >
            {props.saving
              ? 'Saving…'
              : props.kind === 'made'
                ? 'Save making story'
                : 'Save keeping story'}
          </button>
        ) : null}
      </div>
      {props.error ? <p className="tx-error">{props.error}</p> : null}
    </div>
  )
}
