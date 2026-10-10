// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  blankDraft,
  type ProofSubMetricRow,
} from '@/lib/transparency/disclosures'
import useTransparencyStudio from '../useTransparencyStudio'
import type { LocalRow } from '../types'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  saveDisclosure: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/transparency/disclosures', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/transparency/disclosures')>()
  return {
    ...actual,
    saveDisclosure: mocks.saveDisclosure,
  }
})

function field(code: string): ProofSubMetricRow {
  return {
    sub_metric_code: code,
    label: code,
    definition: 'test',
    value_kind: 'text',
    allowed_values: null,
    unit_source: 'fixed',
    unit: null,
    allowed_units: null,
    requires_method: false,
    allowed_methods: null,
    requires_boundary: false,
    allowed_boundaries: null,
    requires_data_quality: false,
    allowed_data_qualities: null,
    subject_kind_default: 'whole_product',
    metric_code: 'process',
    sort_order: 1,
  }
}

function editableRow(target: ProofSubMetricRow, key = 'draft-row'): LocalRow {
  return {
    key,
    draft: blankDraft(target, {
      status: 'disclosed',
      valueText: 'A value',
    }),
    saved: null,
  }
}

function fakeClient(fields: ProofSubMetricRow[]) {
  const calls = { disclosures: 0 }
  const client = {
    from: vi.fn((table: string) => {
      const result =
        table === 'proof_sub_metrics'
          ? { data: fields, error: null }
          : table === 'proof_metrics'
            ? { data: [], error: null }
            : { data: [], error: null }
      if (table === 'product_disclosures') calls.disclosures += 1

      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        then: (
          resolve: (value: typeof result) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => Promise.resolve(result).then(resolve, reject),
      }
      return query
    }),
  }
  return { client, calls }
}

beforeEach(() => {
  mocks.createClient.mockReset()
  mocks.saveDisclosure.mockReset()
})

describe('useTransparencyStudio save orchestration', () => {
  it('reloads after a stale save response', async () => {
    const target = field('process_method')
    const { client, calls } = fakeClient([target])
    mocks.createClient.mockReturnValue(client)
    mocks.saveDisclosure.mockResolvedValue({
      ok: false,
      error: 'Updated elsewhere',
      code: 'STALE_EDIT',
    })

    const { result } = renderHook(() =>
      useTransparencyStudio({ productId: 12, canEdit: true })
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(calls.disclosures).toBe(1)

    await act(async () => {
      await result.current.handleSave(target, editableRow(target))
    })

    await waitFor(() => expect(calls.disclosures).toBe(2))
    expect(result.current.errors['draft-row']).toBe('Updated elsewhere')
  })

  it('demotes editing after the server rejects publishing capability', async () => {
    const target = field('process_method')
    const { client } = fakeClient([target])
    mocks.createClient.mockReturnValue(client)
    mocks.saveDisclosure.mockResolvedValue({
      ok: false,
      error: 'Your role cannot publish',
      code: 'NOT_ALLOWED_TO_PUBLISH',
    })

    const { result } = renderHook(() =>
      useTransparencyStudio({ productId: 12, canEdit: true })
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.canEdit).toBe(true)

    await act(async () => {
      await result.current.handleSave(target, editableRow(target))
    })

    expect(result.current.canEdit).toBe(false)
  })

  it('keeps successful bundle writes when a later item fails', async () => {
    const first = field('process_method')
    const second = field('process_parameter')
    const { client } = fakeClient([first, second])
    mocks.createClient.mockReturnValue(client)
    mocks.saveDisclosure
      .mockResolvedValueOnce({ ok: true, disclosureId: 101, changed: true })
      .mockResolvedValueOnce({ ok: false, error: 'Second save failed' })

    const { result } = renderHook(() =>
      useTransparencyStudio({ productId: 12, canEdit: true })
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      for (const target of [first, second]) {
        const row = result.current.rowsByMetric[target.sub_metric_code]![0]!
        result.current.updateRow(target.sub_metric_code, row.key, {
          ...row.draft,
          status: 'disclosed',
          valueText: `Value for ${target.sub_metric_code}`,
        })
      }
    })

    await act(async () => {
      await result.current.handleSaveBundle(
        ['process_method', 'process_parameter'],
        'ops-made'
      )
    })

    expect(
      result.current.rowsByMetric['process_method']![0]!.draft.disclosureId
    ).toBe(101)
    expect(
      result.current.rowsByMetric['process_parameter']![0]!.draft.disclosureId
    ).toBeNull()
    expect(result.current.storyError).toBe('Second save failed')
  })
})
