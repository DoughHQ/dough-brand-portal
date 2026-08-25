import { describe, expect, it } from 'vitest'
import {
  compareGroupBattlesCaption,
  countByStatus,
  intelligenceL2Href,
  intelligenceL3Href,
  isHideableEmpty,
  readinessL3Href,
  relativeTime,
  studyBattlesCaption,
  type ReadinessRow,
} from '../categoryReadiness.shared'
import { parseScopeSearchRows } from '../categoryReport/scopeSearch'

function row(partial: Partial<ReadinessRow>): ReadinessRow {
  return {
    nodeId: 1,
    l1Name: 'Snacks',
    name: 'Popcorn',
    battles: 0,
    distinctRaters: 0,
    productsBattled: 0,
    raters7d: 0,
    raters30d: 0,
    studyBattlesExcluded: 0,
    compareGroupBattles: 0,
    compareGroupRaters: 0,
    lastBattleAt: null,
    raterThreshold: 50,
    status: 'empty',
    ...partial,
  }
}

describe('category readiness helpers', () => {
  it('counts returned statuses without inventing a new gate', () => {
    const counts = countByStatus([
      row({ status: 'empty' }),
      row({ status: 'empty' }),
      row({ status: 'building' }),
      row({ status: 'approaching' }),
      row({ status: 'sellable' }),
      row({ status: 'unknown' }),
    ])
    expect(counts).toEqual({
      empty: 2,
      building: 1,
      approaching: 1,
      sellable: 1,
    })
  })

  it('links rankings by category name, not node id', () => {
    expect(intelligenceL2Href('Soda & Carbonated')).toBe(
      '/admin/categories/Soda%20%26%20Carbonated'
    )
    expect(intelligenceL3Href('Yogurt', 'Greek Yogurt')).toBe(
      '/admin/categories/Yogurt/Greek%20Yogurt'
    )
    expect(readinessL3Href(9220064)).toBe('/admin/categories/9220064/readiness')
  })

  it('renders last_battle_at as relative time and blank when null', () => {
    expect(relativeTime(null)).toBe('')
    expect(relativeTime(new Date().toISOString())).toBe('just now')
  })

  it('hides only empty rows with no leftover activity', () => {
    expect(isHideableEmpty(row({ status: 'empty' }))).toBe(true)
    expect(
      isHideableEmpty(
        row({
          status: 'empty',
          distinctRaters: 0,
          compareGroupBattles: 93,
          compareGroupRaters: 40,
        })
      )
    ).toBe(false)
    expect(
      isHideableEmpty(row({ status: 'empty', studyBattlesExcluded: 12 }))
    ).toBe(false)
  })

  it('captions leftover battles under the name and omits zeros', () => {
    expect(studyBattlesCaption(0)).toBeNull()
    expect(studyBattlesCaption(12)).toBe('12 study battles not counted')
    expect(studyBattlesCaption(1)).toBe('1 study battle not counted')
    expect(compareGroupBattlesCaption(0)).toBeNull()
    expect(compareGroupBattlesCaption(93)).toBe(
      '93 compare-group battles — different question, not in this ranking.'
    )
    expect(compareGroupBattlesCaption(1)).toBe(
      '1 compare-group battle — different question, not in this ranking.'
    )
  })
})

describe('parseScopeSearchRows', () => {
  it('keeps parent_name so same-named scopes stay distinct', () => {
    const hits = parseScopeSearchRows([
      {
        scope: 'compare_group',
        scope_id: 11,
        name: 'Breakfast',
        parent_name: 'Breakfast. What do you actually eat?',
        distinct_raters: 8,
        rater_threshold: 50,
        status: 'building',
      },
      {
        scope: 'compare_group',
        scope_id: 12,
        name: 'Breakfast',
        parent_name: 'What gets you going in the morning?',
        distinct_raters: 3,
        rater_threshold: 50,
        status: 'building',
      },
      {
        scope: 'l3',
        scope_id: 22,
        name: 'Juice & Lemonade Mixes',
        parent_name: 'Drink Mixes',
        distinct_raters: 0,
        rater_threshold: 50,
        status: 'empty',
      },
    ])
    expect(hits).toHaveLength(3)
    expect(hits[0]?.parentName).toBe('Breakfast. What do you actually eat?')
    expect(hits[1]?.parentName).toBe('What gets you going in the morning?')
    expect(hits[2]).toMatchObject({ scope: 'l3', parentName: 'Drink Mixes' })
  })

  it('drops malformed rows instead of casting', () => {
    expect(
      parseScopeSearchRows([
        { scope: 'l2', scope_id: 0, name: 'Bad' },
        { scope: 'nope', scope_id: 1, name: 'Nope' },
        { scope: 'l2', scope_id: 9220004, name: 'Energy & Sports', parent_name: 'Drinks' },
      ])
    ).toEqual([
      {
        scope: 'l2',
        scopeId: 9220004,
        name: 'Energy & Sports',
        parentName: 'Drinks',
        distinctRaters: 0,
        raterThreshold: 0,
        status: 'empty',
      },
    ])
  })
})
