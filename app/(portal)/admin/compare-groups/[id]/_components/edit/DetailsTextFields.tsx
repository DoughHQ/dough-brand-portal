import { inputStyle, labelStyle } from './editModel'
import type { EditDetailsState } from './useEditDetails'

export function DetailsTextFields({
  name,
  setName,
  question,
  setQuestion,
  description,
  setDescription,
}: Pick<
  EditDetailsState,
  'name' | 'setName' | 'question' | 'setQuestion' | 'description' | 'setDescription'
>) {
  return (
    <>
      <label style={labelStyle}>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
      </label>

      <label style={labelStyle}>
        Consumer question
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      <label style={labelStyle}>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>
    </>
  )
}
