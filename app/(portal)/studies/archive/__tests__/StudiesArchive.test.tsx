import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { WithdrawnStudyRow } from '@/lib/studies/types'
import StudiesArchive from '../StudiesArchive'

function row(overrides: Partial<WithdrawnStudyRow> = {}): WithdrawnStudyRow {
  return {
    mission_id: 'withdrawn-1',
    title: 'Trashed oat',
    status: 'archived',
    is_draft: false,
    brand_id: 7,
    brand_name: 'Maple',
    focal_product_id: 1,
    focal_product_name: 'Keel Lemon',
    template_code: null,
    total_claims: 0,
    completed_claims: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    deleted_at: '2026-02-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderArchive(isOpen: boolean, study: WithdrawnStudyRow = row()) {
  return renderToStaticMarkup(
    <StudiesArchive
      rows={[study]}
      isOpen={isOpen}
      showBrand
      busyId={null}
      pending={false}
      onToggle={() => undefined}
      onRestore={() => undefined}
      onDelete={() => undefined}
    />,
  )
}

describe('StudiesArchive', () => {
  it('keeps the archived studies closed', () => {
    const markup = renderArchive(false)

    expect(markup).toContain('class="studies-archive-card"')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('Archived studies')
    expect(markup).toContain('(1)')
    expect(markup).not.toContain('id="archived-studies-panel"')
    expect(markup).not.toContain('Trashed oat')
    expect(markup).not.toContain('Restore')
  })

  it('lists a withdrawn study before its restore action', () => {
    const markup = renderArchive(true)

    expect(markup).toContain('class="studies-archive-card is-open"')
    expect(markup).toContain('aria-expanded="true"')
    expect(markup).toContain('id="archived-studies-panel"')
    expect(markup).toContain('class="studies-archive-name"')
    expect(markup).toContain('class="studies-withdrawn-badge"')
    expect(markup).toContain('class="studies-archive-restore"')
    expect(markup).toContain('aria-label="More actions"')
    expect(markup).toContain('Keel Lemon · Maple · ')
    const title = markup.indexOf('Trashed oat')
    const badge = markup.indexOf('Withdrawn')
    const restore = markup.indexOf('>Restore<')
    expect(badge).toBeGreaterThan(title)
    expect(restore).toBeGreaterThan(badge)
  })

  it('hides delete when the withdrawn study has claims', () => {
    const markup = renderArchive(true, row({ total_claims: 2 }))

    expect(markup).toContain('>Restore<')
    expect(markup).not.toContain('More actions')
  })
})
