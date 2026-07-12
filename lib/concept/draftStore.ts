import type { ConceptStudyDraft } from './types'
import { DRAFT_STORAGE_KEY } from './constants'

function readAll(): ConceptStudyDraft[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ConceptStudyDraft[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(drafts: ConceptStudyDraft[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))
}

export function listConceptDrafts(): ConceptStudyDraft[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getConceptDraft(draftId: string): ConceptStudyDraft | null {
  return readAll().find((d) => d.draftId === draftId) ?? null
}

export function saveConceptDraft(draft: ConceptStudyDraft): ConceptStudyDraft {
  const next = { ...draft, updatedAt: new Date().toISOString() }
  const all = readAll().filter((d) => d.draftId !== next.draftId)
  all.unshift(next)
  writeAll(all)
  return next
}

export function deleteConceptDraft(draftId: string): void {
  writeAll(readAll().filter((d) => d.draftId !== draftId))
}
