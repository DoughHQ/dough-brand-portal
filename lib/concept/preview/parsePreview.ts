import type { ProtocolQuestion } from './planTypes'

export const DEACTIVATED_BRAND_MESSAGE =
  'One of your competitors is no longer available — fix the field before previewing.'

function asRecord(data: unknown): Record<string, unknown> | null {
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return null
}

function hintFromUnknown(error: {
  message?: string
  hint?: string
}): string | null {
  if (typeof error.hint === 'string' && error.hint.trim()) return error.hint.trim()
  const msg = error.message ?? ''
  if (msg.includes('OPTION_ID_UNRESOLVED')) return 'OPTION_ID_UNRESOLVED'
  return null
}

export function previewErrorMessage(error: {
  message?: string
  hint?: string
}): string {
  if (hintFromUnknown(error) === 'OPTION_ID_UNRESOLVED') {
    return DEACTIVATED_BRAND_MESSAGE
  }
  return error.message?.trim() || 'Could not build the walkthrough.'
}

function asQuestion(raw: unknown): ProtocolQuestion | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const code = typeof o.question_type_code === 'string' ? o.question_type_code : ''
  if (!code) return null
  const config =
    o.config != null && typeof o.config === 'object' && !Array.isArray(o.config)
      ? (o.config as Record<string, unknown>)
      : {}
  return {
    id: typeof o.id === 'string' ? o.id : undefined,
    question_type_code: code,
    session_number: typeof o.session_number === 'number' ? o.session_number : 1,
    position: typeof o.position === 'number' ? o.position : 0,
    label: typeof o.label === 'string' ? o.label : code,
    config,
    is_required: o.is_required !== false,
    drives_rounds: o.drives_rounds === true,
  }
}

export function parsePreviewQuestionnaire(data: unknown): ProtocolQuestion[] | { error: string } {
  const root = asRecord(data)
  if (root && typeof root.error === 'string') {
    if (root.error.includes('OPTION_ID_UNRESOLVED') || root.hint === 'OPTION_ID_UNRESOLVED') {
      return { error: DEACTIVATED_BRAND_MESSAGE }
    }
    return { error: root.error }
  }
  const list = Array.isArray(data)
    ? data
    : Array.isArray(root?.questions)
      ? root.questions
      : null
  if (!list) return { error: 'Walkthrough returned no questions.' }
  const questions = list.map(asQuestion).filter((q): q is ProtocolQuestion => q != null)
  if (questions.length === 0) return { error: 'Walkthrough returned no questions.' }
  return questions
}
