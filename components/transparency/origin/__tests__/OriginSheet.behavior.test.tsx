// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  blankDraft,
  type DisclosureDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import { PlaceStoryEditor } from '../PlaceStoryEditor'
import type { OriginLocalRow } from '../../OriginSheet'

function field(
  code: string,
  allowedValues: string[] | null = null,
): ProofSubMetricRow {
  return {
    sub_metric_code: code,
    label: code,
    definition: '',
    value_kind: allowedValues ? 'enum' : 'text',
    allowed_values: allowedValues,
    unit_source: 'none',
    unit: null,
    allowed_units: null,
    requires_method: false,
    allowed_methods: null,
    requires_boundary: false,
    allowed_boundaries: null,
    requires_data_quality: false,
    allowed_data_qualities: null,
    subject_kind_default: 'ingredient',
    metric_code: 'origin',
    sort_order: 0,
  }
}

function row(
  source: ProofSubMetricRow,
  key: string,
  patch: Partial<DisclosureDraft>,
): OriginLocalRow {
  return {
    key,
    draft: blankDraft(source, {
      subjectLabel: 'Sugar',
      status: 'disclosed',
      ...patch,
    }),
    saved: null,
  }
}

const country = field('origin_country')
const granularity = field('origin_granularity', [
  'country',
  'region',
  'locality',
  'plot',
])
const region = field('origin_region')
const producer = field('origin_producer_name')
const geolocation = field('origin_geolocation')
const fields = { country, granularity, region, producer, geolocation }

afterEach(cleanup)

describe('PlaceStoryEditor behavior', () => {
  it('normalizes country input and initializes country granularity', () => {
    const onChange = vi.fn()
    const onEnsureRow = vi.fn(
      (source: ProofSubMetricRow) => `new-${source.sub_metric_code}`,
    )
    render(
      <PlaceStoryEditor
        subject="Sugar"
        kind="ingredient"
        fields={fields}
        rows={{}}
        canEdit
        saving={false}
        error={null}
        onEnsureRow={onEnsureRow}
        onChange={onChange}
        onSaveStory={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('US'), {
      target: { value: 'u1s' },
    })

    expect(onEnsureRow).toHaveBeenCalledWith(country, 'Sugar')
    expect(onEnsureRow).toHaveBeenCalledWith(granularity, 'Sugar')
    expect(onChange).toHaveBeenCalledWith(
      'origin_country',
      'new-origin_country',
      expect.objectContaining({ valueText: 'US', status: 'disclosed' }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'origin_granularity',
      'new-origin_granularity',
      expect.objectContaining({ valueText: 'country', status: 'disclosed' }),
    )
  })

  it('creates progressive region rows from the add control', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onEnsureRow = vi.fn(
      (source: ProofSubMetricRow) => `new-${source.sub_metric_code}`,
    )
    render(
      <PlaceStoryEditor
        subject="Sugar"
        kind="ingredient"
        fields={fields}
        rows={{}}
        canEdit
        saving={false}
        error={null}
        onEnsureRow={onEnsureRow}
        onChange={onChange}
        onSaveStory={vi.fn()}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Add region or locality' }),
    )

    expect(onEnsureRow).toHaveBeenCalledWith(granularity, 'Sugar')
    expect(onEnsureRow).toHaveBeenCalledWith(region, 'Sugar')
    expect(onChange).toHaveBeenCalledWith(
      'origin_granularity',
      'new-origin_granularity',
      expect.objectContaining({ valueText: 'region' }),
    )
  })

  it('shares provenance across depth rows and preserves save failures', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSaveStory = vi.fn()
    const countryRow = row(country, 'country-row', { valueText: 'US' })
    const regionRow = row(region, 'region-row', { valueText: 'California' })
    render(
      <PlaceStoryEditor
        subject="Sugar"
        kind="ingredient"
        fields={fields}
        rows={{
          origin_country: countryRow,
          origin_region: regionRow,
        }}
        canEdit
        saving={false}
        error="Could not save this place story."
        onEnsureRow={vi.fn(() => 'unused')}
        onChange={onChange}
        onSaveStory={onSaveStory}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /Brand document/i }))

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenCalledWith(
      'origin_country',
      'country-row',
      expect.objectContaining({ sourceTier: 'brand_document' }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'origin_region',
      'region-row',
      expect.objectContaining({ sourceTier: 'brand_document' }),
    )

    await user.click(
      screen.getByRole('checkbox', {
        name: /Show this place story to shoppers/i,
      }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'origin_country',
      'country-row',
      expect.objectContaining({ published: true }),
    )
    expect(onChange).toHaveBeenCalledWith(
      'origin_region',
      'region-row',
      expect.objectContaining({ published: true }),
    )

    await user.click(screen.getByRole('button', { name: 'Save place story' }))
    expect(onSaveStory).toHaveBeenCalledOnce()
    expect(screen.getByText('Could not save this place story.')).toBeTruthy()
  })
})
