import {
  displayAllCapsPhrase,
  splitIngredientStatement,
} from '@/app/(portal)/products/[productId]/tabs/compositionPresentation'
import {
  isNaturalFlavorPhrase,
  isOilOrFatLike,
  OPS_KEPT_CODES,
  OPS_MADE_CODES,
} from '@/components/transparency/OperationsSheet'
import { ORIGIN_DEPTH_CODES, FINISHED_PRODUCT_SUBJECT } from '@/components/transparency/OriginSheet'
import { PLANET_PACK_CODES } from '@/components/transparency/PlanetSheet'
import {
  RIGHTS_CERT_CODES,
  RIGHTS_DILIGENCE_CODES,
  RIGHTS_GRIEVANCE_CODES,
  RIGHTS_LABOR_CODES,
  RIGHTS_LIVING_CODES,
  RIGHTS_RISK_METRIC,
  RIGHTS_SUPPLIER_CODES,
} from '@/components/transparency/RightsSheet'
import type { BrandProofAskCount } from '@/lib/transparency/proofAskCounts'
import { proofTabAskBadge } from '@/lib/transparency/proofAskCounts'
import {
  chapterForMetric,
  chapterProgress,
  PROOF_CHAPTERS,
  rowPresence,
  type ChapterProgress,
  type ProofChapterId,
} from '@/lib/transparency/proofChapters'
import type { ProofSubMetricRow } from '@/lib/transparency/disclosures'
import type {
  FieldsByChapter,
  ProgressByChapter,
  RowsByMetric,
  StudioTotals,
} from './types'

type ProgressInput = {
  fieldsByChapter: FieldsByChapter
  rowsByMetric: RowsByMetric
  ingredientStatement: string | null
}

type SlotProgress = {
  started: boolean
  published: boolean
}

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function ingredientNames(ingredientStatement: string | null): string[] {
  return ingredientStatement?.trim()
    ? splitIngredientStatement(ingredientStatement).map((part) =>
        displayAllCapsPhrase(part),
      )
    : []
}

function slotProgress(
  codes: readonly string[],
  rowsByMetric: RowsByMetric,
): SlotProgress {
  let started = false
  let published = false
  for (const code of codes) {
    for (const row of rowsByMetric[code] ?? []) {
      const presence = rowPresence(row.draft)
      if (presence !== 'not_started') started = true
      if (presence === 'published') published = true
    }
  }
  return { started, published }
}

function subjectProgress(
  subjects: Set<string>,
  codes: readonly string[],
  rowsByMetric: RowsByMetric,
): ChapterProgress {
  let started = 0
  let published = 0
  for (const subject of subjects) {
    let anyStarted = false
    let anyPublished = false
    for (const code of codes) {
      const row = (rowsByMetric[code] ?? []).find(
        (candidate) => norm(candidate.draft.subjectLabel ?? '') === subject,
      )
      if (!row) continue
      const presence = rowPresence(row.draft)
      if (presence !== 'not_started') anyStarted = true
      if (presence === 'published') anyPublished = true
    }
    if (anyStarted) started += 1
    if (anyPublished) published += 1
  }
  return { total: subjects.size, started, published }
}

export function buildFieldsByChapter(
  fields: ProofSubMetricRow[],
): FieldsByChapter {
  const fieldsByChapter: FieldsByChapter = {
    planet: [],
    rights: [],
    origin: [],
    operations: [],
    formula: [],
  }
  for (const field of fields) {
    fieldsByChapter[chapterForMetric(field.metric_code)].push(field)
  }
  return fieldsByChapter
}

export function calculateFormulaProgress({
  rowsByMetric,
  ingredientStatement,
}: ProgressInput): ChapterProgress {
  const subjects = new Set(ingredientNames(ingredientStatement).map(norm).filter(Boolean))
  for (const code of ['ingredient_percentage', 'sub_ingredient_breakout'] as const) {
    for (const row of rowsByMetric[code] ?? []) {
      const subject = norm(row.draft.subjectLabel ?? '')
      if (subject) subjects.add(subject)
    }
  }
  return subjectProgress(
    subjects,
    ['ingredient_percentage', 'sub_ingredient_breakout'],
    rowsByMetric,
  )
}

export function calculateOriginProgress({
  fieldsByChapter,
  rowsByMetric,
  ingredientStatement,
}: ProgressInput): ChapterProgress {
  const subjects = new Set<string>([
    norm(FINISHED_PRODUCT_SUBJECT),
    ...ingredientNames(ingredientStatement).map(norm).filter(Boolean),
  ])
  for (const code of ORIGIN_DEPTH_CODES) {
    for (const row of rowsByMetric[code] ?? []) {
      const subject = norm(row.draft.subjectLabel ?? '')
      if (subject) subjects.add(subject)
    }
  }

  const places = subjectProgress(subjects, ORIGIN_DEPTH_CODES, rowsByMetric)
  const journeyFields = fieldsByChapter.origin.filter(
    (field) => field.metric_code !== 'origin',
  )
  const journey = chapterProgress(journeyFields, rowsByMetric)
  const coverageRows = rowsByMetric['origin_coverage_pct'] ?? []
  const coverageStarted = coverageRows.some(
    (row) => rowPresence(row.draft) !== 'not_started',
  )
    ? 1
    : 0
  const coveragePublished = coverageRows.some(
    (row) => rowPresence(row.draft) === 'published',
  )
    ? 1
    : 0
  const coverageTotal = fieldsByChapter.origin.some(
    (field) => field.sub_metric_code === 'origin_coverage_pct',
  )
    ? 1
    : 0

  return {
    total: places.total + journey.total + coverageTotal,
    started: places.started + journey.started + coverageStarted,
    published: places.published + journey.published + coveragePublished,
  }
}

export function calculateOperationsProgress({
  fieldsByChapter,
  rowsByMetric,
  ingredientStatement,
}: ProgressInput): ChapterProgress {
  const oilSubjects = new Set<string>()
  const flavorSubjects = new Set<string>()
  for (const name of ingredientNames(ingredientStatement)) {
    if (isOilOrFatLike(name)) oilSubjects.add(norm(name))
    if (isNaturalFlavorPhrase(name)) flavorSubjects.add(norm(name))
  }
  for (const row of rowsByMetric['refinement_state'] ?? []) {
    const subject = norm(row.draft.subjectLabel ?? '')
    if (subject) oilSubjects.add(subject)
  }
  for (const row of rowsByMetric['natural_flavor_composition'] ?? []) {
    const subject = norm(row.draft.subjectLabel ?? '')
    if (subject) flavorSubjects.add(subject)
  }
  const aidSubjects = (rowsByMetric['processing_aid_disclosed'] ?? []).filter(
    (row) => (row.draft.subjectLabel ?? '').trim(),
  )

  const made = slotProgress(OPS_MADE_CODES, rowsByMetric)
  const kept = slotProgress(OPS_KEPT_CODES, rowsByMetric)
  const pasteur = slotProgress(['pasteurization_method'], rowsByMetric)
  const additional = slotProgress(['additional_treatment'], rowsByMetric)
  const oil = subjectProgress(oilSubjects, ['refinement_state'], rowsByMetric)
  const flavor = subjectProgress(
    flavorSubjects,
    ['natural_flavor_composition'],
    rowsByMetric,
  )
  const aidStarted = aidSubjects.filter(
    (row) => rowPresence(row.draft) !== 'not_started',
  ).length
  const aidPublished = aidSubjects.filter(
    (row) => rowPresence(row.draft) === 'published',
  ).length

  const has = (code: string) =>
    fieldsByChapter.operations.some((field) => field.sub_metric_code === code)
  const madeTotal = has('process_method') || has('process_parameter') ? 1 : 0
  const keptTotal =
    has('storage_condition') || has('shelf_life_basis') || has('handling_note')
      ? 1
      : 0
  const pasteurTotal = has('pasteurization_method') ? 1 : 0
  const additionalTotal = has('additional_treatment') ? 1 : 0
  const oilTotal = has('refinement_state') ? Math.max(oilSubjects.size, 0) : 0
  const flavorTotal = has('natural_flavor_composition')
    ? Math.max(flavorSubjects.size, 0)
    : 0
  const aidTotal = has('processing_aid_disclosed')
    ? Math.max(aidSubjects.length, 0)
    : 0

  return {
    total:
      madeTotal +
      keptTotal +
      pasteurTotal +
      additionalTotal +
      oilTotal +
      flavorTotal +
      aidTotal,
    started:
      (made.started ? madeTotal : 0) +
      (kept.started ? keptTotal : 0) +
      (pasteur.started ? pasteurTotal : 0) +
      (additional.started ? additionalTotal : 0) +
      oil.started +
      flavor.started +
      aidStarted,
    published:
      (made.published ? madeTotal : 0) +
      (kept.published ? keptTotal : 0) +
      (pasteur.published ? pasteurTotal : 0) +
      (additional.published ? additionalTotal : 0) +
      oil.published +
      flavor.published +
      aidPublished,
  }
}

export function calculatePlanetProgress({
  fieldsByChapter,
  rowsByMetric,
}: ProgressInput): ChapterProgress {
  const pcf = slotProgress(['product_carbon_footprint'], rowsByMetric)
  const packSubjects = new Set<string>()
  for (const code of PLANET_PACK_CODES) {
    for (const row of rowsByMetric[code] ?? []) {
      const subject = norm(row.draft.subjectLabel ?? '')
      if (subject) packSubjects.add(subject)
    }
  }
  const pack = subjectProgress(packSubjects, PLANET_PACK_CODES, rowsByMetric)
  const restFields = fieldsByChapter.planet.filter(
    (field) =>
      field.metric_code === 'land_and_soil' ||
      field.metric_code === 'corporate_footprint',
  )
  const rest = chapterProgress(restFields, rowsByMetric)
  const pcfTotal = fieldsByChapter.planet.some(
    (field) => field.sub_metric_code === 'product_carbon_footprint',
  )
    ? 1
    : 0

  return {
    total: pcfTotal + pack.total + rest.total,
    started: (pcf.started ? pcfTotal : 0) + pack.started + rest.started,
    published: (pcf.published ? pcfTotal : 0) + pack.published + rest.published,
  }
}

export function calculateRightsProgress({
  fieldsByChapter,
  rowsByMetric,
}: ProgressInput): ChapterProgress {
  const slot = (codes: readonly string[]) => {
    const progress = slotProgress(codes, rowsByMetric)
    return {
      present: codes.some((code) =>
        fieldsByChapter.rights.some((field) => field.sub_metric_code === code),
      ),
      ...progress,
    }
  }
  const slots = [
    slot(RIGHTS_LIVING_CODES),
    slot(RIGHTS_LABOR_CODES),
    slot(RIGHTS_CERT_CODES),
    slot(RIGHTS_DILIGENCE_CODES),
    slot(RIGHTS_GRIEVANCE_CODES),
    slot(RIGHTS_SUPPLIER_CODES),
  ]
  const riskFields = fieldsByChapter.rights.filter(
    (field) => field.metric_code === RIGHTS_RISK_METRIC,
  )
  const risk = chapterProgress(riskFields, rowsByMetric)

  return {
    total: slots.filter((item) => item.present).length + risk.total,
    started:
      slots.filter((item) => item.present && item.started).length + risk.started,
    published:
      slots.filter((item) => item.present && item.published).length +
      risk.published,
  }
}

export function calculateProgressByChapter(
  input: ProgressInput,
): ProgressByChapter {
  return {
    planet: calculatePlanetProgress(input),
    rights: calculateRightsProgress(input),
    origin: calculateOriginProgress(input),
    operations: calculateOperationsProgress(input),
    formula: calculateFormulaProgress(input),
  }
}

export function calculateTotals(
  progressByChapter: ProgressByChapter,
): StudioTotals {
  let published = 0
  let privateN = 0
  let untouched = 0
  for (const chapter of PROOF_CHAPTERS) {
    const progress = progressByChapter[chapter.id]
    published += progress.published
    privateN += Math.max(0, progress.started - progress.published)
    untouched += Math.max(0, progress.total - progress.started)
  }
  return { published, privateN, untouched }
}

export function selectDefaultChapter(
  progressByChapter: ProgressByChapter,
): ProofChapterId {
  let best: ProofChapterId = 'planet'
  let bestScore = -1
  for (const chapter of PROOF_CHAPTERS) {
    const progress = progressByChapter[chapter.id]
    if (progress.total === 0) continue
    const unfinished = progress.total - progress.published
    if (unfinished > bestScore) {
      bestScore = unfinished
      best = chapter.id
    }
  }
  return best
}

export function depthSummary(
  chapterId: ProofChapterId,
  progressByChapter: ProgressByChapter,
  rowsByMetric: RowsByMetric,
  pcfAsk: BrandProofAskCount | null,
): string {
  const progress = progressByChapter[chapterId]
  if (chapterId === 'origin') {
    const verified = ORIGIN_DEPTH_CODES.reduce(
      (count, code) =>
        count +
        (rowsByMetric[code] ?? []).filter(
          (row) =>
            rowPresence(row.draft) !== 'not_started' &&
            row.draft.sourceTier === 'third_party_verified',
        ).length,
      0,
    )
    const places = progress.started
    if (places === 0) return 'No places yet'
    return verified > 0
      ? `${places} places · ${verified} verified`
      : `${places} places`
  }
  if (chapterId === 'planet') {
    const pcfOn = (rowsByMetric['product_carbon_footprint'] ?? []).some(
      (row) => rowPresence(row.draft) !== 'not_started',
    )
    const packN = new Set(
      PLANET_PACK_CODES.flatMap((code) =>
        (rowsByMetric[code] ?? [])
          .map((row) => (row.draft.subjectLabel ?? '').trim().toLowerCase())
          .filter(Boolean),
      ),
    ).size
    const bits = [pcfOn ? 'PCF' : null, packN > 0 ? `${packN} pack` : null].filter(
      Boolean,
    )
    if (bits.length) return bits.join(' · ')
    const asked = proofTabAskBadge(pcfAsk)
    if (asked > 0) {
      return asked === 1 ? '1 shopper asked' : `${asked.toLocaleString()} asked`
    }
    return 'Not started'
  }
  if (chapterId === 'formula') {
    return progress.started > 0 ? `${progress.started} ingredients` : 'Not started'
  }
  if (chapterId === 'operations' || chapterId === 'rights') {
    return progress.started > 0
      ? `${progress.published}/${progress.total} live`
      : 'Not started'
  }
  return progress.started > 0
    ? `${progress.published}/${progress.total} published`
    : 'Not started'
}
