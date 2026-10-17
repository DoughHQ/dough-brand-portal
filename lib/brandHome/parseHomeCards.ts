import type { ProductSignalCardModel } from '@/lib/brandHome/productSignalCards'
import type { HomeCategoryCard, HomeHero, HomeStudyRow } from '@/lib/brandHome/selectHomeModel'
import { brandCategoryOverviewHref } from '@/lib/categoryReport/href'
import { studyHref, type HomeStudyInput } from '@/lib/brandHome/selectHomeModel'
import { conceptListStatus, type StudyOrderStatus } from '@/lib/checkout/status'
import {
  asBool,
  asNum,
  asRecord,
  asStr,
} from './parseBrandHomeSnapshot'

export function parseSignalCards(raw: unknown): ProductSignalCardModel[] {
  if (!Array.isArray(raw)) return []
  const out: ProductSignalCardModel[] = []
  for (const item of raw) {
    const r = asRecord(item)
    if (!r) continue
    const productId = asNum(r.product_id)
    if (!Number.isFinite(productId) || productId <= 0) continue
    const name = asStr(r.name) || `Product ${productId}`
    const category = asStr(r.category)
    const unlocked = asBool(r.standing_unlocked)
    const rankLabel = asStr(r.standing_rank_label)
    const tooltip =
      asStr(r.standing_tooltip) ||
      `See where ${name} ranks among ${category ?? 'category'} tasters once enough people have compared it.`
    out.push({
      productId,
      name,
      category,
      imageUrl: asStr(r.image_url),
      comparisonEvents: asNum(r.comparison_events),
      href: `/products/${productId}`,
      standing: {
        unlocked: unlocked && rankLabel != null,
        rankLabel: unlocked ? rankLabel : null,
        tooltip,
      },
    })
  }
  return out
}

export function parseCategoriesTop(raw: unknown): HomeCategoryCard[] {
  if (!Array.isArray(raw)) return []
  const out: HomeCategoryCard[] = []
  for (const item of raw) {
    const r = asRecord(item)
    if (!r) continue
    const l2 = asNum(r.l2_node_id)
    const name = asStr(r.name)
    if (!Number.isFinite(l2) || l2 <= 0 || !name) continue
    const unlocked = asBool(r.unlocked)
    const battled = asNum(r.products_with_battles)
    out.push({
      l2NodeId: l2,
      name,
      status: battled > 0 ? 'active' : 'building',
      detail: battled > 0 ? `${battled.toLocaleString()} with battles` : 'In your catalog',
      href: brandCategoryOverviewHref(l2),
      unlocked,
      ctaLabel: unlocked ? 'Open' : 'Preview',
      bannerImageUrl: asStr(r.banner_image_url),
    })
  }
  return out
}

export function parseL2NodeIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  const out: number[] = []
  for (const item of raw) {
    const n = asNum(item)
    if (Number.isFinite(n) && n > 0) out.push(n)
  }
  return out
}

export function studyRowFromHighlight(
  raw: unknown,
  orderStatus: StudyOrderStatus | null
): HomeStudyRow | null {
  const r = asRecord(raw)
  if (!r) return null
  const id = asStr(r.id)
  const title = asStr(r.title)
  if (!id || !title) return null
  const lifecycle = (asStr(r.lifecycle_state) ?? 'active') as
    | 'active'
    | 'scheduled'
    | 'completed'
    | 'expired'
    | 'draft'
    | 'paused'
    | 'archived'
    | 'in_review'
  const missionType = asStr(r.mission_type)
  const input: HomeStudyInput = {
    mission_id: id,
    title,
    lifecycle_state: lifecycle,
    mission_type: missionType,
    test_type: missionType === 'concept_test' ? 'concept' : null,
    completed_claims: asNum(r.completed_claims),
    total_claims: asNum(r.total_claims),
    target_completions: r.target_completions == null ? null : asNum(r.target_completions),
    order_status: orderStatus,
  }
  const { href, ctaLabel } = studyHref(input)
  const concept = conceptListStatus(input)
  const kind = asStr(r.kind)
  const badge = concept
    ? concept.label
    : kind === 'stuck'
      ? 'Needs claims'
      : kind === 'results'
        ? 'Results ready'
        : 'Live'
  const snapshotDetail = asStr(r.detail) || ''
  const detail =
    concept?.label === 'Awaiting payment'
      ? 'Waiting on payment.'
      : concept?.label === 'Not live'
        ? 'This study is not live yet.'
        : snapshotDetail
  return {
    missionId: id,
    title,
    badge,
    detail,
    progress: null,
    href: concept?.href ?? href,
    ctaLabel: concept?.href ? 'Checkout' : ctaLabel,
  }
}

export function buildHeroFromSnapshot(
  brandName: string,
  study: HomeStudyRow | null,
  narrative: { headline: string; sub: string } | null
): HomeHero {
  if (study) {
    return {
      kind: study.badge === 'Results ready' ? 'study_ready' : 'narrative',
      eyebrow: study.badge,
      headline: study.title,
      body:
        study.badge === 'Awaiting payment' || study.badge === 'Not live'
          ? study.detail
          : study.detail || 'Your research is live.',
      ctaLabel: study.ctaLabel,
      ctaHref: study.href,
    }
  }
  if (narrative?.headline) {
    return {
      kind: 'narrative',
      eyebrow: brandName,
      headline: narrative.headline,
      body: narrative.sub,
      ctaLabel: 'Open studies',
      ctaHref: '/studies',
    }
  }
  return {
    kind: 'empty',
    eyebrow: brandName,
    headline: 'Your brand command center',
    body: 'Open a study or explore categories to build signal.',
    ctaLabel: 'Browse products',
    ctaHref: '/products',
  }
}
