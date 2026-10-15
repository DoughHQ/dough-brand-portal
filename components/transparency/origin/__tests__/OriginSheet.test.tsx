import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import OriginSheet, {
  FINISHED_PRODUCT_SUBJECT,
  ORIGIN_DEPTH_CODES,
  type OriginLocalRow,
} from '../../OriginSheet'
import { PlaceStoryEditor } from '../PlaceStoryEditor'
import { blankDraft, type ProofSubMetricRow } from '@/lib/transparency/disclosures'

function field(code: string, subjectKind = 'ingredient'): ProofSubMetricRow {
  return {
    sub_metric_code: code,
    label: code,
    definition: '',
    value_kind: 'text',
    allowed_values: null,
    unit_source: 'none',
    unit: null,
    allowed_units: null,
    requires_method: false,
    allowed_methods: null,
    requires_boundary: false,
    allowed_boundaries: null,
    requires_data_quality: false,
    allowed_data_qualities: null,
    subject_kind_default: subjectKind,
    metric_code: 'origin',
    sort_order: 0,
  }
}

function row(f: ProofSubMetricRow, key: string, subjectLabel: string | null): OriginLocalRow {
  return { key, draft: blankDraft(f, { subjectLabel }), saved: null }
}

const handlers = {
  onChange: vi.fn(),
  onEnsureRow: vi.fn(() => 'k'),
  onAddCustomIngredient: vi.fn(),
  onSaveStory: vi.fn(),
  onSaveCoverage: vi.fn(),
}

function inOrder(html: string, needles: string[]) {
  let cursor = 0
  for (const needle of needles) {
    const at = html.indexOf(needle, cursor)
    expect(at, needle).toBeGreaterThanOrEqual(0)
    cursor = at + needle.length
  }
}

describe('OriginSheet shell', () => {
  it('keeps the shared subject and depth codes on the shell export surface', () => {
    expect(FINISHED_PRODUCT_SUBJECT).toBe('Finished product')
    expect(ORIGIN_DEPTH_CODES).toEqual([
      'origin_country',
      'origin_granularity',
      'origin_region',
      'origin_producer_name',
      'origin_geolocation',
    ])
  })

  it('renders the registry empty state without origin fields', () => {
    const html = renderToStaticMarkup(
      <OriginSheet
        ingredientStatement="Sugar"
        fieldsByCode={{}}
        rowsByCode={{}}
        canEdit
        savingSubject={null}
        storyError={null}
        {...handlers}
      />,
    )
    expect(html).toBe('<div class="tx-empty">No origin fields in the registry.</div>')
  })

  it('renders banner, coverage, product line, label lines, custom lines, and add button in order', () => {
    const country = field('origin_country')
    const coverage = field('origin_coverage_pct', 'whole_product')
    const html = renderToStaticMarkup(
      <OriginSheet
        ingredientStatement="SUGAR, COCOA BUTTER"
        fieldsByCode={{ origin_country: country, origin_coverage_pct: coverage }}
        rowsByCode={{
          origin_country: [row(country, 'c1', 'Vanilla')],
          origin_coverage_pct: [row(coverage, 'cov', null)],
        }}
        canEdit
        savingSubject={null}
        storyError={null}
        {...handlers}
      />,
    )
    inOrder(html, [
      'Seeded from this SKU’s ingredient statement.',
      'Formula coverage',
      '<span>Subject</span><span>Place</span><span>Status</span>',
      `>${FINISHED_PRODUCT_SUBJECT}<`,
      '>Product<',
      '>Sugar<',
      '>Cocoa Butter<',
      '>Vanilla<',
      '>Not on label<',
      'Ingredient not on the label',
    ])
  })

  it('hides coverage and add controls when read-only without a statement', () => {
    const country = field('origin_country')
    const html = renderToStaticMarkup(
      <OriginSheet
        ingredientStatement={null}
        fieldsByCode={{ origin_country: country }}
        rowsByCode={{}}
        canEdit={false}
        savingSubject={null}
        storyError={null}
        {...handlers}
      />,
    )
    expect(html.replaceAll('<!-- -->', '')).toContain(
      'No ingredient statement on this SKU yet. Start with <strong>Finished product</strong>',
    )
    expect(html).not.toContain('Formula coverage')
    expect(html).not.toContain('Ingredient not on the label')
  })
})

describe('PlaceStoryEditor', () => {
  it('renders the place story fields in order', () => {
    const country = field('origin_country')
    const html = renderToStaticMarkup(
      <PlaceStoryEditor
        subject="Sugar"
        kind="ingredient"
        fields={{ country, granularity: null, region: null, producer: null, geolocation: null }}
        rows={{ origin_country: row(country, 'c1', 'Sugar') }}
        canEdit
        saving={false}
        error={null}
        onEnsureRow={handlers.onEnsureRow}
        onChange={handlers.onChange}
        onSaveStory={handlers.onSaveStory}
      />,
    )
    inOrder(html, ['Where?', 'Country', 'How you know'])
  })
})
