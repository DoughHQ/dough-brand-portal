import type {
  DisclosureDraft,
  ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import type {
  ChapterProgress,
  ProofChapterId,
} from '@/lib/transparency/proofChapters'

export type LocalRow = {
  key: string
  draft: DisclosureDraft
  saved: DisclosureDraft | null
}

export type RowsByMetric = Record<string, LocalRow[]>

export type FieldsByChapter = Record<ProofChapterId, ProofSubMetricRow[]>

export type ProgressByChapter = Record<ProofChapterId, ChapterProgress>

export type StudioTotals = {
  published: number
  privateN: number
  untouched: number
}

export type InventoryGroup = {
  metricCode: string
  label: string
  fields: ProofSubMetricRow[]
}

export type UpdateRow = (
  subMetricCode: string,
  key: string,
  draft: DisclosureDraft,
) => void
