import { describe, expect, it } from 'vitest'
import { prototypeReadiness } from '../readiness'

function base(over: Partial<Parameters<typeof prototypeReadiness>[0]> = {}) {
  return {
    name: 'Test chips',
    image_paths: ['prototype-images/1/a.jpg'],
    allergens_declared_at: '2026-10-04T00:00:00Z',
    allergens_contains: [] as string[],
    allergens_may_contain: [] as string[],
    ...over,
  }
}

describe('prototypeReadiness', () => {
  it('is ready when name, photo, and allergens exist', () => {
    expect(prototypeReadiness(base())).toBe('ready')
  })

  it('needs allergens when declaration is missing', () => {
    expect(
      prototypeReadiness(
        base({
          allergens_declared_at: null,
          allergens_contains: null,
          allergens_may_contain: null,
        })
      )
    ).toBe('needs_allergens')
  })

  it('needs photo when images are empty', () => {
    expect(prototypeReadiness(base({ image_paths: [] }))).toBe('needs_photo')
  })

  it('is incomplete when both photo and allergens are missing', () => {
    expect(
      prototypeReadiness(
        base({
          image_paths: [],
          allergens_declared_at: null,
          allergens_contains: null,
          allergens_may_contain: null,
        })
      )
    ).toBe('incomplete')
  })
})
