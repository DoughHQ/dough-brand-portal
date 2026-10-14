import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CorrectionReviewRow } from '@/lib/corrections.shared'
import { CaseStage } from '../CaseStage'

vi.mock('server-only', () => ({}))
vi.mock('../../actions', () => ({
  searchBrandsAction: vi.fn(),
  searchTaxonomyAction: vi.fn(),
}))

const noop = () => {}

function row(overrides: Record<string, unknown> = {}): CorrectionReviewRow {
  return {
    id: 'c1',
    product_id: 4,
    product_name_short: 'Maple bar',
    brand_name: 'Maple',
    brand_id: 1,
    correction_type: 'category',
    current_category: 'Dairy',
    current_category_path: null,
    proposed_category_label: 'Oat milk',
    proposed_taxonomy_node_id: 9,
    created_at: '2026-10-11T12:00:00.000Z',
    evidence_preview_url: 'https://cdn.example/evidence.jpg',
    product_image_url: null,
    evidence_capture_path: null,
    ...overrides,
  } as unknown as CorrectionReviewRow
}

function stage(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    <CaseStage
      row={row(overrides)}
      busy={false}
      nowMs={Date.parse('2026-10-11T12:00:00.000Z')}
      workspaceBrandId={1}
      workspaceBrandName="Maple"
      editorOpen={false}
      rejectChip="Wrong product"
      related={[]}
      onOpenRelated={noop}
      onExtract={noop}
      onOpenEditor={noop}
      onCloseEditor={noop}
      onExpandEvidence={noop}
      onPickReject={noop}
      onApply={noop}
      onApplyValue={noop}
      onReject={noop}
    />,
  )
}

describe('CaseStage', () => {
  it('shows a category claim ready to apply', () => {
    const html = stage()
    expect(html).toContain('data-correction-id="c1"')
    expect(html).toContain('Maple bar')
    expect(html).toContain('>M<')
    expect(html).toContain('Waiting today')
    expect(html).toContain('title="Oct 11, 2026 · 12:00 PM UTC"')
    expect(html).toContain('Category change')
    expect(html).toContain('They want Dairy → Oat milk.')
    expect(html).toContain('Dairy')
    expect(html).toContain('>Oat milk<')
    expect(html).toContain('Apply “Oat milk”')
    expect(html).toContain('This report is wrong')
    expect(html).toContain('Wrong product')
    expect(html).toContain('corr-chip-on')
    expect(html).toContain('https://cdn.example/evidence.jpg')
  })

  it('says the photo is unavailable when the capture has no preview', () => {
    const html = stage({
      evidence_preview_url: null,
      evidence_capture_path: 'captures/c1.jpg',
    })
    expect(html).toContain('Photo unavailable')
    expect(html).not.toContain('https://cdn.example/evidence.jpg')
  })
})
