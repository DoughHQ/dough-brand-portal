'use client'

import type { BoxStudyDraft } from '@/lib/box/types'
import { ihutJourneyLengthLabel } from '@/lib/box/preview/screensFromIhutJourney'
import { BOX_ANCHORS } from '@/lib/box/validity'
import BuilderSectionChrome from '../concept/BuilderSectionChrome'
import Day1Steps from './method/Day1Steps'
import Day2Panel from './method/Day2Panel'
import { helpStyle, warnStyle } from './method/methodStyles'
import { useBoxMethod } from './method/useBoxMethod'
import { PRODUCT_NAME } from '@/lib/brand'

type Props = {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
  sectionDone?: boolean
}

export default function MethodSection({
  draft,
  onChange,
  sectionDone = false,
}: Props) {
  const method = useBoxMethod({ draft, onChange })
  const lengthLabel = ihutJourneyLengthLabel(method.journey)

  return (
    <BuilderSectionChrome
      id={BOX_ANCHORS.method}
      title="Questions"
      summary={lengthLabel ?? ''}
      done={sectionDone}
    >
      <p style={helpStyle}>
        The {PRODUCT_NAME} in-home method. Two battle tracks on the same scale — shelf
        before opening, taste after — so the report can separate pack from
        recipe. Prompts and order are locked; you pick attributes, optional
        questions, and success bars.
      </p>

      {!lengthLabel ? (
        <p className="cb-questions-length">
          {method.seatCount < 2
            ? 'Add at least 2 products to see length'
            : method.journeyError
              ? 'Length unavailable'
              : 'Building length…'}
        </p>
      ) : null}

      {method.tasteOnly ? (
        <p style={warnStyle} role="status">
          This box will run taste-only — at least one seat is a plain sample, so
          Battles, expectation, and ease of opening are skipped.
        </p>
      ) : null}

      <Day1Steps
        steps={method.day1Steps}
        openId={method.openId}
        setOpenId={method.setOpenId}
        attrs={method.attrs}
        brandQs={method.brandQs}
        bars={method.bars}
        seatCount={method.seatCount}
        battlePairs={method.battlePairs}
        journey={method.journey}
        fieldOptions={method.fieldOptions}
        fieldSeats={method.fieldSeats}
        tasteOnly={method.tasteOnly}
        draft={draft}
        onToggleAttr={method.toggleAttr}
        onBrandQs={method.patchBrandQs}
        onBars={method.setBars}
      />
      <Day2Panel
        draft={draft}
        day2On={method.day2On}
        tasteOnly={method.tasteOnly}
        day2OpenId={method.day2OpenId}
        setDay2OpenId={method.setDay2OpenId}
        onPatch={method.patch}
      />
    </BuilderSectionChrome>
  )
}
