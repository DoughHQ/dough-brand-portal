// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CompareGroupListItem } from '@/lib/compareGroups.shared'
import { useCompareGroups } from '../useCompareGroups'

function group(overrides: Partial<CompareGroupListItem> = {}): CompareGroupListItem {
  return {
    compare_group_id: 1,
    code: 'oat',
    name: 'Oat milk',
    strategy: 'single',
    status: 'active',
    type: null,
    version: 1,
    battle_level: null,
    consumer_question: 'Which oat milk?',
    has_question: true,
    node_count: 2,
    battle_count: 12,
    product_count: 4,
    respondent_count: 3,
    has_time_priors: false,
    peak_bucket: null,
    peak_hours: null,
    max_prior_weight: null,
    ...overrides,
  }
}

const oat = group()
const yogurt = group({
  compare_group_id: 2,
  code: 'yog',
  name: 'Yogurt',
  consumer_question: 'Thick or thin?',
  battle_count: 1,
  respondent_count: 9,
  status: 'draft',
})

describe('useCompareGroups', () => {
  it('sorts names A–Z and filters by name, question, or code', () => {
    const { result } = renderHook(() => useCompareGroups([yogurt, oat]))
    expect(result.current.activePreset).toBe('name')
    expect(result.current.rows.map((entry) => entry.name)).toEqual(['Oat milk', 'Yogurt'])

    act(() => {
      result.current.setFilter(' THICK ')
    })
    expect(result.current.rows.map((entry) => entry.code)).toEqual(['yog'])

    act(() => {
      result.current.setFilter('oat')
    })
    expect(result.current.rows.map((entry) => entry.compare_group_id)).toEqual([1])
  })

  it('applies battle, respondent, and time-of-day filters', () => {
    const morning = group({
      compare_group_id: 3,
      name: 'Morning bar',
      code: 'am',
      battle_count: 50,
      respondent_count: 10,
      has_time_priors: true,
      peak_bucket: 'morning',
    })
    const { result } = renderHook(() => useCompareGroups([oat, yogurt, morning]))
    expect(result.current.hasTodData).toBe(true)

    act(() => {
      result.current.setMinBattles(10)
    })
    expect(result.current.rows.map((entry) => entry.name)).toEqual(['Morning bar', 'Oat milk'])

    act(() => {
      result.current.setMinRespondents(10)
      result.current.setTod('morning')
    })
    expect(result.current.rows.map((entry) => entry.name)).toEqual(['Morning bar'])

    act(() => {
      result.current.setMinBattles(0)
      result.current.setMinRespondents(0)
      result.current.setTod('none')
    })
    expect(result.current.rows.map((entry) => entry.name)).toEqual(['Oat milk', 'Yogurt'])
  })

  it('flips a column and starts a preset descending, except name', () => {
    const { result } = renderHook(() => useCompareGroups([yogurt, oat]))
    act(() => {
      result.current.toggleSort('name')
    })
    expect(result.current.sortDir).toBe('desc')
    expect(result.current.rows.map((entry) => entry.name)).toEqual(['Yogurt', 'Oat milk'])
    expect(result.current.activePreset).toBeNull()

    act(() => {
      result.current.applyPreset('respondents')
    })
    expect(result.current.sortKey).toBe('respondents')
    expect(result.current.sortDir).toBe('desc')
    expect(result.current.activePreset).toBe('respondents')
    expect(result.current.rows.map((entry) => entry.name)).toEqual(['Yogurt', 'Oat milk'])

    act(() => {
      result.current.applyPreset('name')
    })
    expect(result.current.sortDir).toBe('asc')
    expect(result.current.activePreset).toBe('name')
  })
})
