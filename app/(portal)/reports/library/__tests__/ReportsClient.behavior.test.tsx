// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Brand } from '@/lib/queries'
import type { Report } from '../reportsModel'

const mocks = vi.hoisted(() => ({
  catalog: {
    data: [] as Report[],
    error: null as { message: string } | null,
  },
  purchases: {
    data: [] as { report_catalog_id: number }[],
  },
  from: vi.fn(),
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ from: mocks.from }),
}))
vi.mock('../../reportsPage.css', () => ({}))
vi.mock('@/components/reports/reports_skeleton.css', () => ({}))
vi.mock('@/components/portal/skeleton_bones.css', () => ({}))

import ReportsClient from '../../ReportsClient'

function report(partial: Partial<Report> = {}): Report {
  return {
    report_catalog_id: 1,
    report_type: 'category_ranking',
    title: 'Snack rankings',
    description: 'Who wins snacks.',
    taxonomy_node_id: 7,
    taxonomy_level: 'l2',
    time_window_days: 90,
    min_battles: 25,
    verified_only: true,
    price_cents: 49900,
    category_name: 'Snacks',
    ...partial,
  }
}

function renderReports() {
  return render(
    <ReportsClient
      brand={{ brand_name: 'Acme' } as unknown as Brand}
      isAdmin={false}
      brandId={3}
      brandCategoryIds={[7]}
    />,
  )
}

beforeEach(() => {
  mocks.catalog = { data: [], error: null }
  mocks.purchases = { data: [] }
  mocks.push.mockReset()
  mocks.from.mockReset()
  mocks.from.mockImplementation((table: string) => {
    if (table === 'report_catalog') {
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve(mocks.catalog),
          }),
        }),
      }
    }
    if (table === 'report_purchases') {
      return {
        select: () => ({
          eq: () => Promise.resolve(mocks.purchases),
        }),
      }
    }
    throw new Error(`Unexpected table: ${table}`)
  })
})

afterEach(cleanup)

describe('ReportsClient behavior', () => {
  it('loads reports and applies search and type filters', async () => {
    mocks.catalog = {
      data: [
        report(),
        report({
          report_catalog_id: 2,
          report_type: 'health_benchmark',
          title: 'Health benchmark',
          taxonomy_node_id: null,
        }),
      ],
      error: null,
    }
    mocks.purchases = { data: [{ report_catalog_id: 1 }] }
    const user = userEvent.setup()
    renderReports()

    expect(await screen.findByText('Snack rankings')).toBeTruthy()
    expect(screen.getByText('Purchased')).toBeTruthy()
    expect(screen.getByText('Health benchmark')).toBeTruthy()
    expect(screen.getByText('Available to purchase')).toBeTruthy()
    expect(mocks.from).toHaveBeenCalledWith('report_catalog')
    expect(mocks.from).toHaveBeenCalledWith('report_purchases')

    await user.click(screen.getByRole('button', { name: 'Health Benchmarks' }))
    expect(screen.queryByText('Snack rankings')).toBeNull()
    expect(screen.getByText('Health benchmark')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Search reports…'), {
      target: { value: 'missing' },
    })
    expect(screen.queryByText('Health benchmark')).toBeNull()
    expect(screen.getByText('No reports of this type yet.')).toBeTruthy()
    expect(screen.getByText('No reports match your search.')).toBeTruthy()
  })

  it('logs a catalog failure and finishes in the empty state', async () => {
    mocks.catalog = {
      data: [],
      error: { message: 'catalog unavailable' },
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderReports()

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        'reports fetch error:',
        mocks.catalog.error,
      ),
    )
    expect(screen.queryByText('Loading reports')).toBeNull()
    expect(screen.getByText('No reports match your search.')).toBeTruthy()
    consoleError.mockRestore()
  })
})
