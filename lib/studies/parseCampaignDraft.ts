/**
 * Parse create_campaign_draft RPC success payload for live box/concept mint.
 */

export type CreateCampaignDraftResult = {
  campaignId: string
  missionId: string | null
  protocolId: string | null
}

function requireObject(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`missing object at ${path}`)
  }
  return value as Record<string, unknown>
}

export function parseCreateCampaignDraftResult(data: unknown): CreateCampaignDraftResult {
  const root = requireObject(data, 'create_campaign_draft')
  if (typeof root.campaign_id !== 'string' || root.campaign_id.length === 0) {
    throw new Error('create_campaign_draft returned no campaign_id')
  }
  return {
    campaignId: root.campaign_id,
    missionId: root.mission_id == null ? null : String(root.mission_id),
    protocolId: root.protocol_id == null ? null : String(root.protocol_id),
  }
}
