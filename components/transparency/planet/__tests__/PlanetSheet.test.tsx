import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import PlanetSheet, {
  DEFAULT_PACK_COMPONENTS,
  PLANET_PACK_CODES,
  PLANET_PCF_CODES,
  type PlanetLocalRow,
} from '../../PlanetSheet'
import { blankDraft, type ProofSubMetricRow } from '@/lib/transparency/disclosures'

function field(code: string, subjectKind = 'whole_product'): ProofSubMetricRow {
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
    metric_code: 'planet',
    sort_order: 0,
  }
}

function row(f: ProofSubMetricRow, key: string, subjectLabel: string | null): PlanetLocalRow {
  return { key, draft: blankDraft(f, { subjectLabel }), saved: null }
}

const handlers = {
  onChange: vi.fn(),
  onEnsureRow: vi.fn(() => 'k'),
  onSaveRow: vi.fn(),
  onSaveBundle: vi.fn(),
  onSeedPackComponents: vi.fn(),
}

function inOrder(html: string, needles: string[]) {
  let cursor = 0
  for (const needle of needles) {
    const at = html.indexOf(needle, cursor)
    expect(at, needle).toBeGreaterThanOrEqual(0)
    cursor = at + needle.length
  }
}

describe('PlanetSheet shell', () => {
  it('keeps the shared code lists on the shell export surface', () => {
    expect(PLANET_PCF_CODES).toEqual(['product_carbon_footprint', 'pcf_assurance_level'])
    expect(PLANET_PACK_CODES).toEqual([
      'packaging_primary_material',
      'packaging_disposal_route',
      'packaging_recycled_content_pct',
      'packaging_reuse_model',
    ])
    expect(DEFAULT_PACK_COMPONENTS).toEqual(['Bottle', 'Cap', 'Sleeve'])
  })

  it('renders empty registry rooms in order', () => {
    const html = renderToStaticMarkup(
      <PlanetSheet
        fieldsByCode={{}}
        rowsByCode={{}}
        canEdit
        savingKey={null}
        storyError="Boom"
        errors={{}}
        {...handlers}
      />,
    )
    inOrder(html, [
      '<p class="tx-error">Boom</p>',
      'Product carbon claim',
      'No product footprint fields in the registry.',
      'Packaging components',
      'No packaging fields in the registry.',
    ])
  })

  it('renders the footprint editor and pack sheet with seed when fields exist', () => {
    const pcf = field('product_carbon_footprint')
    const material = field('packaging_primary_material', 'component')
    const html = renderToStaticMarkup(
      <PlanetSheet
        fieldsByCode={{ product_carbon_footprint: pcf, packaging_primary_material: material }}
        rowsByCode={{ product_carbon_footprint: [row(pcf, 'pcf', null)] }}
        canEdit
        savingKey="planet-pcf"
        storyError={null}
        errors={{}}
        {...handlers}
      />,
    )
    expect(html).not.toContain('tx-error')
    inOrder(html, [
      'Product carbon claim',
      'Saving…',
      'Packaging components',
      'Seed Bottle, Cap, Sleeve',
      'No packaging components yet. Seed defaults or add one.',
    ])
  })

  it('lists named pack components and hides seed once a component exists', () => {
    const material = field('packaging_primary_material', 'component')
    const html = renderToStaticMarkup(
      <PlanetSheet
        fieldsByCode={{ packaging_primary_material: material }}
        rowsByCode={{
          packaging_primary_material: [row(material, 'm1', 'Bottle'), row(material, 'm2', ' bottle ')],
        }}
        canEdit
        savingKey={null}
        storyError={null}
        errors={{}}
        {...handlers}
      />,
    )
    expect(html).not.toContain('Seed Bottle, Cap, Sleeve')
    expect(html).not.toContain('No packaging components yet.')
    expect(html.split('>Bottle<').length - 1).toBe(1)
  })
})
