import { describe, expect, it } from 'vitest'
import { canPublishStudies } from '../canPublishStudies'

describe('canPublishStudies', () => {
  it.each([
    ['brand_admin', true],
    ['dough_admin', true],
    ['brand_viewer', false],
  ] as const)('%s publish access is %s', (role, expected) => {
    expect(canPublishStudies({ role })).toBe(expected)
  })
})
