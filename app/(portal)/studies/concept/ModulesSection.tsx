'use client'

import ModulesPicker from '../ModulesPicker'
import type { ConceptStudyDraft } from '@/lib/concept/types'
import { CONCEPT_ANCHORS } from '@/lib/concept/validity'
import { sanitizeSelectedModules } from '@/lib/study/modules'
import {
  sectionCard,
  sectionEyebrow,
  sectionHelp,
  sectionTitle,
} from './conceptStyles'

type Props = {
  draft: ConceptStudyDraft
  onChange: (next: ConceptStudyDraft) => void
  disabled?: boolean
  disabledReason?: string | null
}

export default function ModulesSection({
  draft,
  onChange,
  disabled,
  disabledReason,
}: Props) {
  return (
    <section
      id={CONCEPT_ANCHORS.modules}
      style={{
        ...sectionCard,
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      aria-disabled={disabled || undefined}
    >
      <div style={sectionEyebrow}>Section 4 · Modules</div>
      <h2 className="cb-section-title" style={sectionTitle}>
        Add-on modules
      </h2>
      <p style={sectionHelp}>
        Optional analysis packs. The questionnaire for this study type is already
        included — these sit on top and take no extra setup.
      </p>

      {disabled && disabledReason ? (
        <p
          role="status"
          style={{
            margin: '0 0 18px',
            fontSize: 13,
            color: 'var(--ink-50)',
            background: 'var(--surface-1)',
            border: '1px solid var(--ink-10)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
          }}
        >
          {disabledReason}
        </p>
      ) : null}

      <ModulesPicker
        testType="concept"
        selected={sanitizeSelectedModules(draft.selectedModules, 'concept')}
        onChange={(selectedModules) => onChange({ ...draft, selectedModules })}
        disabled={disabled}
      />
    </section>
  )
}
