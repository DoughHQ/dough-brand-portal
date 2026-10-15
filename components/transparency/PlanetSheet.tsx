'use client'

import { useMemo } from 'react'
import { rowPresence } from '@/lib/transparency/proofChapters'
import PlanetDemand from '@/components/transparency/PlanetDemand'
import TransparencyRoom from '@/components/transparency/TransparencyRoom'
import { planetDemandCopy } from '@/lib/transparency/proofAskCounts'
import {
  DEFAULT_PACK_COMPONENTS,
  norm,
  PLANET_PACK_CODES,
  PLANET_PCF_CODES,
  type Props,
  wholeRow,
} from './planet/planetModel'
import { FootprintEditor } from './planet/FootprintEditor'
import { PackSheet } from './planet/PackSheet'

export { PLANET_PCF_CODES, PLANET_PACK_CODES, DEFAULT_PACK_COMPONENTS } from './planet/planetModel'
export type { PlanetLocalRow } from './planet/planetModel'

export default function PlanetSheet({
  fieldsByCode,
  rowsByCode,
  canEdit,
  savingKey,
  storyError,
  errors,
  onChange,
  onEnsureRow,
  onSaveRow,
  onSaveBundle,
  onClearStoryError,
  onSeedPackComponents,
  pcfAsk = null,
}: Props) {
  const pcfField = fieldsByCode['product_carbon_footprint']
  const assuranceField = fieldsByCode['pcf_assurance_level']
  const materialField = fieldsByCode['packaging_primary_material']
  const disposalField = fieldsByCode['packaging_disposal_route']
  const recycledField = fieldsByCode['packaging_recycled_content_pct']
  const reuseField = fieldsByCode['packaging_reuse_model']

  const pcfRow = wholeRow(rowsByCode['product_carbon_footprint'])
  const assuranceRow = wholeRow(rowsByCode['pcf_assurance_level'])
  const demand = planetDemandCopy({
    productAskCount: pcfAsk?.productAskCount ?? 0,
    brandAskCount: pcfAsk?.brandAskCount ?? 0,
    lastAskedAt: pcfAsk?.lastAskedAt ?? null,
    published: rowPresence(pcfRow?.draft) === 'published',
  })

  const packSubjects = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const code of PLANET_PACK_CODES) {
      for (const row of rowsByCode[code] ?? []) {
        const label = row.draft.subjectLabel?.trim()
        if (!label) continue
        const n = norm(label)
        if (seen.has(n)) continue
        seen.add(n)
        out.push(label)
      }
    }
    return out
  }, [rowsByCode])

  const hasAnyPackRow = PLANET_PACK_CODES.some(
    (c) => (rowsByCode[c] ?? []).some((r) => r.draft.subjectLabel?.trim()),
  )

  return (
    <div className="tx-ops">
      {storyError ? <p className="tx-error">{storyError}</p> : null}

      <TransparencyRoom
        kicker="Footprint"
        title="Product carbon claim"
        lede="Number, boundary, method, and data quality as one claim — never green theatre."
      >
        {demand ? <PlanetDemand copy={demand} /> : null}
        {pcfField && pcfRow ? (
          <FootprintEditor
            pcfField={pcfField}
            assuranceField={assuranceField ?? null}
            pcfRow={pcfRow}
            assuranceRow={assuranceRow}
            canEdit={canEdit}
            saving={savingKey === 'planet-pcf'}
            onChange={onChange}
            onSave={() => onSaveBundle(PLANET_PCF_CODES, 'planet-pcf')}
            onClearError={onClearStoryError}
          />
        ) : (
          <p className="tx-ops__empty">No product footprint fields in the registry.</p>
        )}
      </TransparencyRoom>

      <TransparencyRoom
        kicker="Pack"
        title="Packaging components"
        lede="Material, disposal, recycled content — per bottle, cap, sleeve, or tray."
      >
        {!materialField && !disposalField ? (
          <p className="tx-ops__empty">No packaging fields in the registry.</p>
        ) : (
          <PackSheet
            fields={{
              material: materialField ?? null,
              disposal: disposalField ?? null,
              recycled: recycledField ?? null,
              reuse: reuseField ?? null,
            }}
            subjects={packSubjects}
            rowsByCode={rowsByCode}
            canEdit={canEdit}
            savingKey={savingKey}
            errors={errors}
            showSeed={!hasAnyPackRow}
            onChange={onChange}
            onEnsureRow={onEnsureRow}
            onSaveRow={onSaveRow}
            onSeed={() => onSeedPackComponents([...DEFAULT_PACK_COMPONENTS])}
          />
        )}
      </TransparencyRoom>
    </div>
  )
}
