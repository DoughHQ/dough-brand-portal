import type { Dispatch, SetStateAction } from 'react'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import type { PhonePreviewJourney } from '@/lib/concept/journey'
import {
  emptyBrandQuestion,
  type FieldAnswerSeat,
} from '@/lib/concept/singleTest'
import {
  brandQuestionClosedLine,
  brandQuestionScreenLabel,
} from '@/lib/concept/journeyAccordion'
import BrandQuestionEditor from '@/components/studies/BrandQuestionEditor'
import { AccordionRow } from './journeyChrome'

const BRAND_QUESTION_CAP = 2

function AddQuestionControl({
  count,
  cap,
  onAdd,
}: {
  count: number
  cap: number
  onAdd: () => void
}) {
  if (count >= cap) {
    return <p className="cb-question-cap">Two questions.</p>
  }
  return (
    <button type="button" className="cb-quiet-action cb-add-question" onClick={onAdd}>
      Add a question
    </button>
  )
}

export default function JourneyBrandQuestions({
  draft,
  onChange,
  brandQuestions,
  brandStart,
  counts,
  openKey,
  setOpenKey,
  fieldSeats,
  fieldOptions,
  onToggle,
}: {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  brandQuestions: NonNullable<ConceptStudyDraft['brandQuestions']>
  brandStart: number
  counts: PhonePreviewJourney['counts'] | null
  openKey: string | null
  setOpenKey: Dispatch<SetStateAction<string | null>>
  fieldSeats: FieldAnswerSeat[]
  fieldOptions: string[]
  onToggle: (id: string) => void
}) {
  function addBrandQuestion() {
    if (brandQuestions.length >= BRAND_QUESTION_CAP) return
    const next = emptyBrandQuestion()
    onChange({ ...draft, brandQuestions: [...brandQuestions, next] })
    setOpenKey(`brand-${next.localId}`)
  }

  return (
    <>
      {brandQuestions.map((question, qi) => {
        const rowId = `brand-${question.localId}`
        const line = brandQuestionClosedLine(question)
        return (
          <AccordionRow
            key={question.localId}
            id={rowId}
            index={String(brandStart + qi)}
            title={
              brandQuestions.length > 1 ? `Custom question ${qi + 1}` : 'Custom question'
            }
            line={line}
            countLabel={brandQuestionScreenLabel(brandQuestions.length, counts)}
            open={openKey === rowId}
            onToggle={() => onToggle(rowId)}
            rowRef={() => {}}
          >
            <BrandQuestionEditor
              question={question}
              fieldSeats={fieldSeats}
              fieldOptions={fieldOptions}
              onChange={(next) => {
                const list = [...brandQuestions]
                list[qi] = next
                onChange({ ...draft, brandQuestions: list })
              }}
              onRemove={() => {
                onChange({
                  ...draft,
                  brandQuestions: brandQuestions.filter((item) => item.localId !== question.localId),
                })
                setOpenKey((current) => (current === rowId ? null : current))
              }}
            />
          </AccordionRow>
        )
      })}

      <AddQuestionControl
        count={brandQuestions.length}
        cap={BRAND_QUESTION_CAP}
        onAdd={addBrandQuestion}
      />
    </>
  )
}
