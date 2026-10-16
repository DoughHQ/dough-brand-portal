// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { StudyDraftListItem } from '@/app/(portal)/studies/drafts/actions'

const mocks = vi.hoisted(() => ({
  deleteStudyDraftAction: vi.fn(),
  openServerStudyDraft: vi.fn(),
  push: vi.fn(),
  renameStudyDraftAction: vi.fn(),
  unbindByServerDraftId: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))
vi.mock('@/app/(portal)/studies/drafts/actions', () => ({
  deleteStudyDraftAction: mocks.deleteStudyDraftAction,
  renameStudyDraftAction: mocks.renameStudyDraftAction,
}))
vi.mock('@/lib/studies/draftServerBindings', () => ({
  unbindByServerDraftId: mocks.unbindByServerDraftId,
}))
vi.mock('@/lib/studies/openServerDraft', () => ({
  openServerStudyDraft: mocks.openServerStudyDraft,
}))
vi.mock('@/lib/studies/useServerStudyDraft', () => ({
  formatResumeWhen: () => 'yesterday',
}))

import StudyDraftsPanel from '../../StudyDraftsPanel'

function draft(overrides: Partial<StudyDraftListItem> = {}): StudyDraftListItem {
  return {
    id: 'draft-1',
    test_type: 'concept',
    title: 'Oat carton',
    updated_by: 'ada',
    updated_at: '2026-02-01T00:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
    expires_at: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderPanel(currentDrafts = [draft()]) {
  const props = {
    onChange: vi.fn(),
    onError: vi.fn(),
    onToast: vi.fn(),
  }
  render(
    <StudyDraftsPanel
      drafts={currentDrafts}
      effectiveBrandId={7}
      {...props}
    />,
  )
  return props
}

beforeEach(() => {
  mocks.deleteStudyDraftAction.mockReset()
  mocks.deleteStudyDraftAction.mockResolvedValue({ ok: true })
  mocks.renameStudyDraftAction.mockReset()
  mocks.renameStudyDraftAction.mockResolvedValue({ ok: true })
  mocks.openServerStudyDraft.mockReset()
  mocks.push.mockReset()
  mocks.unbindByServerDraftId.mockReset()
  vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
    '2026-10-16T00:00:00.000Z',
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('StudyDraftsPanel behavior', () => {
  it('renames a draft from its overflow menu', async () => {
    const { onChange, onError, onToast } = renderPanel()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const title = screen.getByRole('textbox', { name: 'Draft title' })
    await user.clear(title)
    await user.type(title, 'Oat carton v2')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mocks.renameStudyDraftAction).toHaveBeenCalledWith({
      draftId: 'draft-1',
      testType: 'concept',
      title: 'Oat carton v2',
    })
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        {
          ...draft(),
          title: 'Oat carton v2',
          updated_at: '2026-10-16T00:00:00.000Z',
        },
      ]),
    )
    expect(onError).toHaveBeenCalledWith('')
    expect(onToast).toHaveBeenCalledWith('Draft renamed')
  })

  it('deletes a confirmed draft and clears its local binding', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { onChange, onToast } = renderPanel()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(window.confirm).toHaveBeenCalledWith(
      'Delete “Oat carton”? This can’t be undone.',
    )
    expect(mocks.deleteStudyDraftAction).toHaveBeenCalledWith('draft-1')
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([]))
    expect(mocks.unbindByServerDraftId).toHaveBeenCalledWith('draft-1')
    expect(onToast).toHaveBeenCalledWith('Draft deleted')
  })

  it('keeps the rename form open when the server rejects the title', async () => {
    mocks.renameStudyDraftAction.mockResolvedValue({
      ok: false,
      error: 'Could not rename draft.',
    })
    const { onChange, onError, onToast } = renderPanel()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const title = screen.getByRole('textbox', { name: 'Draft title' })
    await user.clear(title)
    await user.type(title, 'Rejected title')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('textbox', { name: 'Draft title' })).toBeTruthy()
    expect(onError).toHaveBeenLastCalledWith('Could not rename draft.')
    expect(onChange).not.toHaveBeenCalled()
    expect(onToast).not.toHaveBeenCalled()
  })
})
