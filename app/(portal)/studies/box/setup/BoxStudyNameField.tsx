import type { BoxStudyDraft } from '@/lib/box/types'
import { BOX_ANCHORS } from '@/lib/box/validity'
import { inputBase, labelSm } from './setupStyles'

export default function BoxStudyNameField({
  draft,
  onChange,
}: {
  draft: BoxStudyDraft
  onChange: (next: BoxStudyDraft) => void
}) {
  return (
    <div style={{ marginBottom: 24, maxWidth: 480 }}>
      <label htmlFor={BOX_ANCHORS.name} style={labelSm}>
        Study name
      </label>
      <input
        id={BOX_ANCHORS.name}
        className="cb-input"
        value={draft.title}
        onChange={(e) => onChange({ ...draft, title: e.target.value })}
        placeholder="e.g. Gluten-free NYC discovery box"
        style={{ ...inputBase, width: '100%' }}
      />
    </div>
  )
}
