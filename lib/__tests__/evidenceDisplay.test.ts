import { describe, expect, it } from 'vitest'
import { evidenceDisplaySource } from '../corrections.shared'

describe('evidenceDisplaySource', () => {
  it('passes an https photo through', () => {
    expect(evidenceDisplaySource('https://cdn.example/label.jpg')).toEqual({
      kind: 'http',
      url: 'https://cdn.example/label.jpg',
    })
  })

  it('reads a private correction path and rejects anything else', () => {
    expect(evidenceDisplaySource('captures:correction/user-1/42/1.jpg')).toEqual({
      kind: 'captures',
      path: 'correction/user-1/42/1.jpg',
    })
    expect(evidenceDisplaySource('captures:legacy/staging/1/front.jpg')).toBeNull()
    expect(evidenceDisplaySource('captures:correction/../secret.jpg')).toBeNull()
    expect(evidenceDisplaySource(null)).toBeNull()
  })
})
