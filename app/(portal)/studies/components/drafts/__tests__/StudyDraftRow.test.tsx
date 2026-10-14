import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { StudyDraftListItem } from '@/app/(portal)/studies/drafts/actions'
import StudyDraftRow from '../StudyDraftRow'

vi.mock('@/lib/studies/useServerStudyDraft', () => ({
  formatResumeWhen: () => 'yesterday',
}))

function draft(overrides: Partial<StudyDraftListItem> = {}): StudyDraftListItem {
  return {
    id: 'draft-1',
    test_type: 'concept',
    title: null,
    updated_by: 'ada',
    updated_at: '2026-02-01T00:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
    expires_at: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

const idle = {
  busy: false,
  opening: false,
  renaming: false,
  renameValue: '',
  onRenameValue: () => undefined,
  onSaveRename: () => undefined,
  onCancelRename: () => undefined,
  onOpen: () => undefined,
  onStartRename: () => undefined,
  onDelete: () => undefined,
}

describe('StudyDraftRow', () => {
  it('puts the draft name ahead of continue', () => {
    const markup = renderToStaticMarkup(<StudyDraftRow row={draft()} {...idle} />)

    expect(markup).toContain('class="studies-study-row studies-study-row--draft"')
    expect(markup).toContain('class="studies-type-badge"')
    expect(markup).toContain('class="studies-row-cta"')
    expect(markup).toContain('aria-label="More actions"')
    const name = markup.indexOf('Untitled study')
    const badge = markup.indexOf('>Concept<')
    const updated = markup.indexOf('Updated yesterday')
    const action = markup.indexOf('>Continue →<')
    expect(name).toBeGreaterThanOrEqual(0)
    expect(badge).toBeGreaterThan(name)
    expect(updated).toBeGreaterThan(badge)
    expect(action).toBeGreaterThan(updated)
    expect(markup).not.toContain('Opening…')
    expect(markup).not.toContain('disabled')
  })

  it('labels an ihut draft and a draft of unknown type', () => {
    const ihut = renderToStaticMarkup(
      <StudyDraftRow row={draft({ test_type: 'ihut', title: 'Oat carton' })} {...idle} />,
    )
    const other = renderToStaticMarkup(
      <StudyDraftRow row={draft({ test_type: 'box', title: 'Carton' })} {...idle} />,
    )

    expect(ihut).toContain('>Oat carton<')
    expect(ihut).toContain('>iHUT<')
    expect(other).toContain('>Study<')
  })

  it('shows opening while continue is in flight', () => {
    const markup = renderToStaticMarkup(
      <StudyDraftRow row={draft({ title: 'Oat carton' })} {...idle} busy opening />,
    )

    expect(markup).toContain('>Opening…<')
    expect(markup).toContain('disabled=""')
    expect(markup).not.toContain('Continue →')
  })

  it('replaces the row with the rename form', () => {
    const markup = renderToStaticMarkup(
      <StudyDraftRow
        row={draft({ title: 'Oat carton' })}
        {...idle}
        renaming
        renameValue="Oat carton"
      />,
    )

    const field = markup.indexOf('aria-label="Draft title"')
    const save = markup.indexOf('>Save<')
    const cancel = markup.indexOf('>Cancel<')
    expect(field).toBeGreaterThanOrEqual(0)
    expect(save).toBeGreaterThan(field)
    expect(cancel).toBeGreaterThan(save)
    expect(markup).not.toContain('Continue →')
    expect(markup).not.toContain('disabled')
  })

  it('keeps save disabled until the title has text', () => {
    const markup = renderToStaticMarkup(
      <StudyDraftRow row={draft()} {...idle} renaming renameValue="  " />,
    )

    expect(markup).toContain('disabled=""')
    expect(markup).toContain('>Save<')
  })
})
