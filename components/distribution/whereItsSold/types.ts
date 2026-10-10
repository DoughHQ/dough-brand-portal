import type { Dispatch, SetStateAction } from 'react'
import type { DistributionCoord } from '@/lib/distribution/coords'
import type {
  AvailabilityReport,
  DistributionRow,
} from '@/lib/distribution/grouping'

export type SkuOption = {
  sku_variant_id: number
  label: string
}

export type Props = {
  productId: number
  productTitle?: string | null
  canEdit: boolean
  skus: SkuOption[]
}

export type PendingDeclare = {
  retailerId: number
  scopeLevel: 'national' | 'region'
  geoRegionId: number | null
  skuVariantId: number | null
  notes?: string | null
  afterCorrectCoord?: DistributionCoord
  afterCorrectNote?: string
}

export type ModalKind =
  | null
  | {
      kind: 'add'
      prefill?: Partial<DistributionCoord> & {
        afterCorrect?: boolean
        note?: string
      }
    }
  | { kind: 'delist'; declarationId: number; coveredByNational: boolean }
  | {
      kind: 'dispute'
      coord: DistributionCoord
      retailerName: string
      scopeLabel: string
    }
  | {
      kind: 'nationwide-confirm'
      pending: PendingDeclare
      returnToAdd?: boolean
    }
  | { kind: 'claim-all'; seeds: DistributionRow[] }

export type CardHandlers = {
  onConfirm: (
    row: DistributionRow,
    pending: AvailabilityReport[],
  ) => void
  onCorrect: (row: DistributionRow) => void
  onDispute: (row: DistributionRow) => void
  onClaim: (row: DistributionRow) => void
  onRedeclare: (row: DistributionRow) => void
  onWithdraw: (row: DistributionRow) => void
  onDelist: (row: DistributionRow) => void
}

export type DistributionActionRuntime = {
  productId: number
  load: () => Promise<void>
  setError: Dispatch<SetStateAction<string | null>>
  setBusy: Dispatch<SetStateAction<string | null>>
  setToast: Dispatch<SetStateAction<string | null>>
  setModal: Dispatch<SetStateAction<ModalKind>>
  isCurrentProduct: (expectedProductId: number) => boolean
  afterWrite: (message: string, expectedProductId: number) => Promise<void>
}
