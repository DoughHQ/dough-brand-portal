import type { BrandApplication } from '@/lib/brandApplications'

export type BrandApplicationDialog =
  | null
  | { kind: 'approve' | 'reject' | 'resend' | 'revoke'; row: BrandApplication }
