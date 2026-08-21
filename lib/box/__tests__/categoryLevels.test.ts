import { describe, expect, it } from 'vitest'
import {
  categoryLevelLoopCopy,
  loopsForCategoryLevel,
} from '../categoryLevels'

describe('loopsForCategoryLevel', () => {
  it('matches the category_level_thresholds table', () => {
    expect(loopsForCategoryLevel(1)).toBe(1)
    expect(loopsForCategoryLevel(3)).toBe(5)
    expect(loopsForCategoryLevel(10)).toBe(50)
    expect(loopsForCategoryLevel(20)).toBe(495)
    expect(loopsForCategoryLevel(0)).toBeNull()
    expect(loopsForCategoryLevel(21)).toBeNull()
  })
})

describe('categoryLevelLoopCopy', () => {
  it('translates a typed level into loop count', () => {
    expect(categoryLevelLoopCopy(3, 'Ice Cream')).toBe(
      'Level 3 = 5 completed loops in Ice Cream'
    )
    expect(categoryLevelLoopCopy(1, null)).toBe('Level 1 = 1 completed loop')
    expect(categoryLevelLoopCopy(null)).toMatch(/1–20/)
  })
})
