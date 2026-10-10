import type { PortalUser } from '@/lib/queries'

export function canPublishStudies(
  portalUser: Pick<PortalUser, 'role'>
): boolean {
  return portalUser.role !== 'brand_viewer'
}
