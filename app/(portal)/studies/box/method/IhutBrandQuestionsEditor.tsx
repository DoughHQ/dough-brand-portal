import BrandQuestionEditor from '@/components/studies/BrandQuestionEditor'
import {
  IHUT_BRAND_QUESTION_STARTERS,
  boxFieldAnswerSeats,
  emptyIhutBrandQuestion,
  type IhutBrandQuestionDraft,
} from '@/lib/box/method'
import { syncBrandQuestionFieldOptions } from '@/lib/concept/singleTest'

export default function IhutBrandQuestionsEditor({
  questions,
  fieldSeats,
  fieldOptions,
  onChange,
}: {
  questions: IhutBrandQuestionDraft[]
  fieldSeats: ReturnType<typeof boxFieldAnswerSeats>
  fieldOptions: string[]
  onChange: (next: IhutBrandQuestionDraft[]) => void
}) {
  function patchAt(i: number, next: IhutBrandQuestionDraft) {
    const list = [...questions]
    list[i] = syncBrandQuestionFieldOptions(next, fieldOptions)
    onChange(list)
  }

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {questions.map((q, i) => (
        <BrandQuestionEditor
          key={q.localId}
          question={q}
          fieldSeats={fieldSeats}
          fieldOptions={fieldOptions}
          starters={IHUT_BRAND_QUESTION_STARTERS}
          promptPlaceholder="Ask a closed question about the products in the box"
          onChange={(next) => patchAt(i, next)}
          onRemove={() => onChange(questions.filter((_, j) => j !== i))}
        />
      ))}
      {questions.length < 2 ? (
        <button
          type="button"
          className="cb-quiet-action cb-add-question"
          onClick={() => onChange([...questions, emptyIhutBrandQuestion()])}
        >
          Add a question
        </button>
      ) : null}
    </div>
  )
}
