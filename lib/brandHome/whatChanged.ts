import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'

const STORAGE_PREFIX = 'dough.portal.homeBaseline.v1'

export type HomeBaseline = {
  openStudiesCount: number
  productsWithBattles: number
  gainingCount: number
  unlockedL2Ids: number[]
  studyMissionId: string | null
  studyBadge: string | null
  seenAt: number
}

export type WhatChangedItem = {
  id: string
  label: string
  href: string
}

function storageKey(brandId: number): string {
  return `${STORAGE_PREFIX}.${brandId}`
}

function pulseInt(model: BrandHomeModel, key: string): number {
  const raw = model.pulse.find((p) => p.key === key)?.value ?? ''
  const n = Number(String(raw).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function captureHomeBaseline(model: BrandHomeModel): HomeBaseline {
  const study = model.studies[0] ?? null
  return {
    openStudiesCount: model.openStudiesCount,
    productsWithBattles: model.productsWithBattles,
    gainingCount: pulseInt(model, 'gaining'),
    unlockedL2Ids: model.categories.filter((c) => c.unlocked).map((c) => c.l2NodeId),
    studyMissionId: study?.missionId ?? null,
    studyBadge: study?.badge ?? null,
    seenAt: Date.now(),
  }
}

export function readHomeBaseline(brandId: number): HomeBaseline | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(brandId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as HomeBaseline
    if (!parsed || typeof parsed !== 'object') return null
    if (!Array.isArray(parsed.unlockedL2Ids)) return null
    return parsed
  } catch {
    return null
  }
}

export function writeHomeBaseline(brandId: number, baseline: HomeBaseline): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(brandId), JSON.stringify(baseline))
  } catch {
    // ignore
  }
}

/** Pure diff — used by tests and the client hook. */
export function diffWhatChanged(
  prev: HomeBaseline | null,
  next: HomeBaseline,
  model: BrandHomeModel,
): WhatChangedItem[] {
  if (!prev) return []

  const items: WhatChangedItem[] = []
  const study = model.studies[0] ?? null

  if (
    study &&
    study.badge.toLowerCase().includes('results') &&
    (prev.studyBadge?.toLowerCase().includes('results') !== true ||
      prev.studyMissionId !== study.missionId)
  ) {
    items.push({
      id: 'results-ready',
      label: `Results ready · ${study.title}`,
      href: study.href,
    })
  }

  if (
    study &&
    study.badge.toLowerCase().includes('needs claims') &&
    prev.studyMissionId === study.missionId &&
    prev.studyBadge !== study.badge
  ) {
    items.push({
      id: 'needs-claims',
      label: `Needs claims · ${study.title}`,
      href: study.href,
    })
  }

  const openDelta = next.openStudiesCount - prev.openStudiesCount
  if (openDelta !== 0) {
    items.push({
      id: 'open-delta',
      label:
        openDelta > 0
          ? `+${openDelta} open stud${openDelta === 1 ? 'y' : 'ies'}`
          : `${openDelta} open studies`,
      href: '/studies',
    })
  }

  const battledDelta = next.productsWithBattles - prev.productsWithBattles
  if (battledDelta > 0) {
    items.push({
      id: 'battled-delta',
      label: `+${battledDelta} product${battledDelta === 1 ? '' : 's'} with battles`,
      href: '/products',
    })
  }

  const gainingDelta = next.gainingCount - prev.gainingCount
  if (gainingDelta > 0) {
    items.push({
      id: 'gaining-delta',
      label: `+${gainingDelta} gaining`,
      href: '/products',
    })
  }

  const prevUnlocked = new Set(prev.unlockedL2Ids)
  for (const cat of model.categories) {
    if (cat.unlocked && !prevUnlocked.has(cat.l2NodeId)) {
      items.push({
        id: `unlock-${cat.l2NodeId}`,
        label: `Unlocked · ${cat.name}`,
        href: cat.href,
      })
    }
  }

  return items.slice(0, 6)
}
