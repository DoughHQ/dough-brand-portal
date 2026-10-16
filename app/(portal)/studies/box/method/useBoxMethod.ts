'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BoxStudyDraft } from '@/lib/box/types'
import {
  IHUT_DAY1_JOURNEY,
  IHUT_DEFAULT_ATTRIBUTES,
  boxFieldAnswerSeats,
  ihutBattlePairCount,
  type IhutAttributeCode,
  type IhutBrandQuestionDraft,
  type IhutSuccessBarsDraft,
} from '@/lib/box/method'
import { syncBrandQuestionFieldOptions } from '@/lib/concept/singleTest'
import type { IhutPreviewJourney } from '@/lib/box/preview/screensFromIhutJourney'
import { previewIhutJourneyAction } from '@/app/(portal)/studies/box/boxReadActions'
import { isResolvedBoxSeat } from '@/lib/box/fieldSize'
import { hasLoyaltyModule, resolveBoxSelectedModules } from '@/lib/study/modules'

export function useBoxMethod({
  draft,
  onChange,
}: {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
}) {
  const tasteOnly = draft.fieldProducts.some(
    (r) => isResolvedBoxSeat(r) && r.packaging === 'plain_sample'
  )
  const [openId, setOpenId] = useState<string | null>(() =>
    tasteOnly ? 'taste_battles' : 'shelf_battles'
  )
  const [day2OpenId, setDay2OpenId] = useState<string | null>(null)
  const [journey, setJourney] = useState<IhutPreviewJourney | null>(null)
  const [journeyError, setJourneyError] = useState<string | null>(null)

  const seatCount = draft.fieldProducts.filter(isResolvedBoxSeat).length
  const day2On = draft.day2LiveWithIt ?? hasLoyaltyModule(resolveBoxSelectedModules(draft))

  const attrs = draft.ihutAttributes?.length
    ? draft.ihutAttributes
    : IHUT_DEFAULT_ATTRIBUTES
  const bars = draft.ihutSuccessBars ?? {
    tasteWinShare: 0.5,
    likingShare: 0.5,
    buyAtPriceShare: 0.5,
  }
  const brandQs = draft.ihutBrandQuestions ?? []
  const fieldSeats = useMemo(
    () => boxFieldAnswerSeats(draft.fieldProducts),
    [draft.fieldProducts]
  )
  const fieldOptions = useMemo(
    () => fieldSeats.map((s) => s.label),
    [fieldSeats]
  )
  const battlePairs = ihutBattlePairCount(seatCount)

  const day1Steps = useMemo(() => {
    if (!tasteOnly) return IHUT_DAY1_JOURNEY
    return IHUT_DAY1_JOURNEY.filter(
      (s) => !['shelf_battles', 'expectation'].includes(s.id)
    )
  }, [tasteOnly])

  const loadJourney = useCallback(async () => {
    if (seatCount < 2) {
      setJourney(null)
      setJourneyError(null)
      return
    }
    const result = await previewIhutJourneyAction(draft)
    if (result.preview) {
      setJourney(result.preview)
      setJourneyError(result.ok ? null : result.error)
      return
    }
    setJourney(null)
    setJourneyError(result.ok ? null : result.error)
  }, [draft, seatCount])

  useEffect(() => {
    void loadJourney()
  }, [
    seatCount,
    draft.ihutAttributes,
    draft.ihutBrandQuestions,
    draft.ihutSuccessBars,
    draft.day2LiveWithIt,
    draft.fieldProducts,
    loadJourney,
  ])

  function patch(partial: Partial<BoxStudyDraft>) {
    onChange({ ...draft, ...partial })
  }

  function patchBrandQs(next: IhutBrandQuestionDraft[]) {
    patch({ ihutBrandQuestions: next.slice(0, 2) })
  }

  function toggleAttr(code: IhutAttributeCode) {
    const cur = [...attrs]
    const i = cur.indexOf(code)
    if (i >= 0) {
      if (cur.length <= 1) return
      cur.splice(i, 1)
    } else {
      if (cur.length >= 3) return
      cur.push(code)
    }
    patch({ ihutAttributes: cur })
  }

  function setBars(next: IhutSuccessBarsDraft) {
    patch({ ihutSuccessBars: next })
  }

  // Keep Choose-from-field brand questions aligned with live seats.
  useEffect(() => {
    let changed = false
    const next = brandQs.map((question) => {
      const synced = syncBrandQuestionFieldOptions(question, fieldOptions)
      if (synced !== question) changed = true
      return synced
    })
    if (changed) patchBrandQs(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when field seats change
  }, [fieldOptions])

  return {
    tasteOnly,
    openId,
    setOpenId,
    day2OpenId,
    setDay2OpenId,
    journey,
    journeyError,
    seatCount,
    day2On,
    attrs,
    bars,
    brandQs,
    fieldSeats,
    fieldOptions,
    battlePairs,
    day1Steps,
    patch,
    patchBrandQs,
    toggleAttr,
    setBars,
  }
}
