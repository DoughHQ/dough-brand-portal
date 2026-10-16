// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CategoryReport } from '@/lib/categoryReport/types'

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}))

import CategoryDashboardCanvas from '../CategoryDashboardCanvas'

function report(
  mode: 'brand' | 'admin',
  message: string | null = 'Need more distinct raters.',
): CategoryReport {
  return {
    meta: {
      scope: 'l2',
      scope_id: 7,
      scope_name: 'Snacks',
      as_of: '2026-10-15',
      mode,
      generated_at: null,
      elo_note: null,
      question_scope: null,
    },
    evidence: {
      distinct_raters: 4,
      battles: 12,
      products_battled: 3,
      rater_threshold: 30,
      last_battle_at: null,
      design_effect_mean: null,
      coverage: null,
      concentration: null,
      rater_concentration: null,
      position_balance: null,
    },
    catalog: [
      { product_id: 11, name: 'Oat bar', brand: 'Acme' },
      { product_id: 12, name: 'Cocoa bar', brand: 'Beta' },
    ],
    gate: {
      passes: false,
      reason: 'raters',
      message,
    },
    ranking: null,
    focal: null,
    statistics: null,
    pairwise: null,
  }
}

beforeEach(() => {
  mocks.replace.mockReset()
})

afterEach(cleanup)

describe('CategoryDashboardCanvas behavior', () => {
  it('keeps a brand below the reporting floor and changes its focal product', async () => {
    const user = userEvent.setup()
    render(<CategoryDashboardCanvas report={report('brand')} linkMode="brand" />)

    expect(screen.getByText('Below reporting floor')).toBeTruthy()
    expect(screen.getByText('Need more distinct raters.')).toBeTruthy()
    expect(screen.queryByText('No ranking in this payload.')).toBeNull()

    const focal = screen.getByRole('combobox', { name: 'Your product' })
    await user.selectOptions(focal, '11')
    expect(mocks.replace).toHaveBeenNthCalledWith(1, '/categories/7?focal=11')

    await user.selectOptions(focal, '')
    expect(mocks.replace).toHaveBeenNthCalledWith(2, '/categories/7')
  })

  it('uses the admin preview route and can hide the model drawer', async () => {
    const user = userEvent.setup()
    render(<CategoryDashboardCanvas report={report('admin', null)} />)

    expect(screen.getByText('No ranking in this payload.')).toBeTruthy()
    expect(screen.queryByText('Below reporting floor')).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'Your product' })).toBeNull()
    expect(screen.getByText('Statistics block missing from payload.')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Model & estimator/ }))
    expect(screen.queryByText('Statistics block missing from payload.')).toBeNull()
    expect(screen.getByRole('button', { name: /Show/ })).toBeTruthy()
  })

  it('writes a brand-mode preview focal into the admin harness URL', async () => {
    const user = userEvent.setup()
    render(<CategoryDashboardCanvas report={report('brand')} linkMode="preview" />)

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Your product' }),
      '12',
    )

    expect(mocks.replace).toHaveBeenCalledWith(
      '/admin/report-preview?scope=l2&id=7&mode=brand&focal=12',
    )
  })
})
