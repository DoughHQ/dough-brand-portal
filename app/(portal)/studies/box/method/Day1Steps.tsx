import type { BoxStudyDraft } from '@/lib/box/types'
import {
  attributeLabels,
  type IhutAttributeCode,
  type IhutBrandQuestionDraft,
  type IhutJourneyStep,
  type IhutSuccessBarsDraft,
} from '@/lib/box/method'
import {
  brandQuestionTypeLabel,
  type FieldAnswerSeat,
} from '@/lib/concept/singleTest'
import type { IhutPreviewJourney } from '@/lib/box/preview/screensFromIhutJourney'
import { isResolvedBoxSeat } from '@/lib/box/fieldSize'
import AttributeEditor from './AttributeEditor'
import IhutBrandQuestionsEditor from './IhutBrandQuestionsEditor'
import { isBattleStep, pct } from './methodStyles'
import SuccessBarsEditor from './SuccessBarsEditor'

export default function Day1Steps({
  steps,
  openId,
  setOpenId,
  attrs,
  brandQs,
  bars,
  seatCount,
  battlePairs,
  journey,
  fieldOptions,
  fieldSeats,
  tasteOnly,
  draft,
  onToggleAttr,
  onBrandQs,
  onBars,
}: {
  steps: readonly IhutJourneyStep[]
  openId: string | null
  setOpenId: (id: string | null) => void
  attrs: readonly IhutAttributeCode[]
  brandQs: IhutBrandQuestionDraft[]
  bars: IhutSuccessBarsDraft
  seatCount: number
  battlePairs: number
  journey: IhutPreviewJourney | null
  fieldOptions: string[]
  fieldSeats: FieldAnswerSeat[]
  tasteOnly: boolean
  draft: BoxStudyDraft
  onToggleAttr: (code: IhutAttributeCode) => void
  onBrandQs: (next: IhutBrandQuestionDraft[]) => void
  onBars: (next: IhutSuccessBarsDraft) => void
}) {
  function countLabelFor(stepId: string, editable?: string): string {
    if (editable) return 'Edit'
    if (isBattleStep(stepId) && battlePairs > 0) {
      const fromJourney =
        stepId === 'shelf_battles'
          ? Number(journey?.counts && (journey.counts as { shelf_battles?: number }).shelf_battles)
          : Number(journey?.counts && (journey.counts as { taste_battles?: number }).taste_battles)
      const n = Number.isFinite(fromJourney) && fromJourney > 0 ? fromJourney : battlePairs
      return `${n} matchup${n === 1 ? '' : 's'}`
    }
    return 'Locked'
  }

  return (
    <div className="cb-acc-stack" style={{ marginTop: 8 }}>
      {steps.map((step, index) => {
        const open = openId === step.id
        let line = step.prompt ?? ''
        if (step.id === 'try_each') line = attributeLabels(attrs)
        if (step.id === 'brand_questions') {
          line =
            brandQs.length === 0
              ? 'None yet'
              : brandQs.map((q) => brandQuestionTypeLabel(q)).join(' · ')
        }
        if (step.id === 'success_bars') {
          line = `Taste ${pct(bars.tasteWinShare)} · Liking ${pct(bars.likingShare)} · Buy ${pct(bars.buyAtPriceShare)}`
        }
        if (isBattleStep(step.id) && seatCount >= 2) {
          line = `${step.prompt} · ${battlePairs} matchup${battlePairs === 1 ? '' : 's'}`
        }

        const showFieldAsOptions = isBattleStep(step.id)

        return (
          <section
            key={step.id}
            id={`ihut-step-${step.id}`}
            className={`cb-acc${open ? ' is-open' : ''}`}
          >
            <h3 className="cb-acc-heading">
              <button
                type="button"
                className={`cb-acc-head${step.editable ? ' has-mark' : ''}`}
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : step.id)}
              >
                <span className="cb-acc-index">{index + 1}</span>
                <span className="cb-acc-main">
                  <span className="cb-acc-title">{step.title}</span>
                  {!open ? <span className="cb-acc-summary">{line}</span> : null}
                </span>
                <span className="cb-acc-count">
                  {countLabelFor(step.id, step.editable)}
                </span>
                <span className="cb-acc-chevron" aria-hidden="true" />
              </button>
            </h3>
            {open ? (
              <div className="cb-acc-body" role="region">
                <p className="cb-acc-measures">{step.measures}</p>
                {step.prompt ? (
                  <div className="cb-acc-asked">
                    <p className="cb-acc-question">{step.prompt}</p>
                    {showFieldAsOptions ? (
                      fieldOptions.length >= 2 ? (
                        <ol className="cb-acc-options">
                          {fieldOptions.map((o) => (
                            <li key={o}>{o}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="cb-acc-note">
                          Add products to the field to see who battles.
                        </p>
                      )
                    ) : step.options?.length ? (
                      <ol className="cb-acc-options">
                        {step.options.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                ) : null}
                {step.note ? <p className="cb-acc-note">{step.note}</p> : null}

                {step.editable === 'attributes' ? (
                  <AttributeEditor selected={attrs} onToggle={onToggleAttr} />
                ) : null}
                {step.editable === 'brand_questions' ? (
                  <IhutBrandQuestionsEditor
                    questions={brandQs}
                    fieldSeats={fieldSeats}
                    fieldOptions={fieldOptions}
                    onChange={onBrandQs}
                  />
                ) : null}
                {step.editable === 'success_bars' ? (
                  <SuccessBarsEditor
                    bars={bars}
                    onChange={onBars}
                    priceCheckEnabled={
                      !tasteOnly &&
                      draft.fieldProducts
                        .filter(isResolvedBoxSeat)
                        .every(
                          (r) =>
                            typeof r.price === 'number' &&
                            Number.isFinite(r.price) &&
                            r.price > 0,
                        )
                    }
                  />
                ) : null}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
