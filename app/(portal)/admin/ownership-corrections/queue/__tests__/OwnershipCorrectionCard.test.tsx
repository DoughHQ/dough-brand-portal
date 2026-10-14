import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { PendingOwnershipCorrection } from '@/lib/ownershipCorrections'
import { OwnershipCorrectionCard } from '../OwnershipCorrectionCard'

function row(overrides: Partial<PendingOwnershipCorrection> = {}): PendingOwnershipCorrection {
  return {
    correction_id: 'c1',
    brand_id: 42,
    brand_name: 'Oatly',
    assertion_type: 'has_parent',
    asserted_conglomerate_id: 9,
    asserted_display_name: 'Big Co',
    current_conglomerate_id: 3,
    current_display_name: 'Acme',
    snapshot_is_stale: false,
    live_conglomerate_id: 7,
    user_notes: '  See the filing.  ',
    evidence_url: 'https://example.com/proof',
    submitted_by_portal_user_id: 'abcd1234-rest',
    submitted_at: '2026-10-11T12:00:00.000Z',
    ...overrides,
  }
}

const handlers = {
  setNotesById: vi.fn(),
  setStaleConfirmId: vi.fn(),
  decide: vi.fn(),
  onAcceptClick: vi.fn(),
}

function markup(
  overrides: Partial<PendingOwnershipCorrection> = {},
  extra: { busyId?: string | null; staleConfirmId?: string | null; notes?: string } = {},
) {
  const current = row(overrides)
  return renderToStaticMarkup(
    <OwnershipCorrectionCard
      row={current}
      busyId={extra.busyId ?? null}
      liveNames={new Map([[7, 'Live Parent']])}
      notesById={{ c1: extra.notes ?? 'Checked' }}
      staleConfirmId={extra.staleConfirmId ?? null}
      {...handlers}
    />,
  )
}

describe('OwnershipCorrectionCard', () => {
  it('shows the submitted change, notes, and a safe evidence link', () => {
    const html = markup()
    expect(html).toContain('>Oatly<')
    expect(html).toContain('Brand #42')
    expect(html).toContain('Submitted Oct 11, 2026 · 12:00 PM UTC')
    expect(html).toContain('by abcd1234…')
    expect(html).toContain('Change parent: Acme → Big Co')
    expect(html).toContain('>Notes: <')
    expect(html).toContain('See the filing.')
    expect(html).toContain('href="https://example.com/proof"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('placeholder="Internal note for this decision…"')
    expect(html).toContain('>Checked<')
    expect(html).toContain('>Accept<')
    expect(html).toContain('>Reject<')
    expect(html).not.toContain('apply this correction anyway')
  })

  it('warns when the parent moved and asks before applying', () => {
    const html = markup(
      { snapshot_is_stale: true, current_display_name: 'Acme' },
      { staleConfirmId: 'c1', busyId: 'c1' },
    )
    expect(html).toContain('border:1px solid rgba(192,120,24,0.45)')
    expect(html).toContain('The brand’s parent has changed since this was submitted')
    expect(html).toContain('was Acme, now Live Parent')
    expect(html).toContain('The parent changed since submission — apply this correction anyway?')
    expect(html).toContain('>Applying…<')
    expect(html).toContain('>Working…<')
    expect(html).toContain('disabled=""')
  })

  it('prints an unsafe evidence url as text', () => {
    const html = markup({ evidence_url: 'javascript:alert(1)', user_notes: null, submitted_by_portal_user_id: null, submitted_at: null })
    expect(html).not.toContain('href="javascript:')
    expect(html).toContain('>javascript:alert(1)<')
    expect(html).toContain('Submitted —')
    expect(html).not.toContain('>Notes: <')
  })
})
