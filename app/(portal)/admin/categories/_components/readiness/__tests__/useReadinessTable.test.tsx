// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReadinessRow } from '@/lib/categoryReadiness.shared'
import { useReadinessTable } from '../useReadinessTable'

function row(overrides: Partial<ReadinessRow> = {}): ReadinessRow {
  return {
    nodeId: 4,
    l1Name: 'Dairy',
    name: 'Oat milk',
    battles: 12,
    distinctRaters: 5,
    productsBattled: 3,
    raters7d: 1,
    raters30d: 4,
    studyBattlesExcluded: 2,
    compareGroupBattles: 1,
    compareGroupRaters: 0,
    lastBattleAt: null,
    raterThreshold: 10,
    status: 'sellable',
    ...overrides,
  }
}

const oat = row()
const yogurt = row({
  nodeId: 8,
  name: 'Yogurt',
  distinctRaters: 9,
  battles: 2,
  status: 'approaching',
})
const empty = row({
  nodeId: 9,
  l1Name: 'Pantry',
  name: 'Unused',
  distinctRaters: 0,
  battles: 0,
  productsBattled: 0,
  studyBattlesExcluded: 0,
  compareGroupBattles: 0,
  status: 'empty',
})

describe('useReadinessTable', () => {
  it('sorts by raters descending and names an L2 table', () => {
    const { result } = renderHook(() =>
      useReadinessTable({ rows: [oat, yogurt], hideEmptyDefault: false, level: 'l2' }),
    )
    expect(result.current.nameHeader).toBe('L2')
    expect(result.current.showL1).toBe(true)
    expect(result.current.parentL2Name).toBeUndefined()
    expect(result.current.filtered.map((entry) => entry.name)).toEqual(['Yogurt', 'Oat milk'])
    expect(result.current.statusCounts).toEqual({
      sellable: 1,
      approaching: 1,
      building: 0,
      empty: 0,
    })
  })

  it('filters by category or parent name and hides empty rows', () => {
    const { result } = renderHook(() =>
      useReadinessTable({
        rows: [oat, yogurt, empty],
        hideEmptyDefault: true,
        level: 'l3',
        parentL2Name: 'Oat milk',
      }),
    )
    expect(result.current.nameHeader).toBe('L3')
    expect(result.current.showL1).toBe(false)
    expect(result.current.parentL2Name).toBe('Oat milk')
    expect(result.current.hiddenEmptyCount).toBe(1)
    expect(result.current.filtered.map((entry) => entry.name)).toEqual(['Yogurt', 'Oat milk'])

    act(() => {
      result.current.setQuery(' dairy ')
    })
    expect(result.current.filtered.map((entry) => entry.name)).toEqual(['Yogurt', 'Oat milk'])

    act(() => {
      result.current.setQuery('yogurt')
    })
    expect(result.current.filtered.map((entry) => entry.nodeId)).toEqual([8])
  })

  it('flips the current column and starts a new column descending', () => {
    const { result } = renderHook(() =>
      useReadinessTable({ rows: [oat, yogurt], hideEmptyDefault: false, level: 'l2' }),
    )
    act(() => {
      result.current.toggleSort('raters')
    })
    expect(result.current.sortKey).toBe('raters')
    expect(result.current.sortDir).toBe('asc')
    expect(result.current.filtered.map((entry) => entry.name)).toEqual(['Oat milk', 'Yogurt'])

    act(() => {
      result.current.toggleSort('battles')
    })
    expect(result.current.sortKey).toBe('battles')
    expect(result.current.sortDir).toBe('desc')
    expect(result.current.filtered.map((entry) => entry.name)).toEqual(['Oat milk', 'Yogurt'])
  })
})
