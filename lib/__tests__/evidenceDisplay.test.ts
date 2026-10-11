import { describe, expect, it } from 'vitest'
import {
  blankCorrectionRow,
  canApproveAsIs,
  evidenceDisplaySource,
  evidenceToSign,
} from '../corrections.shared'

describe('evidenceDisplaySource', () => {
  it('passes an https photo through', () => {
    expect(evidenceDisplaySource('https://cdn.example/label.jpg')).toEqual({
      kind: 'http',
      url: 'https://cdn.example/label.jpg',
    })
  })

  it('does not treat a captures ref as a displayable URL', () => {
    expect(evidenceDisplaySource('captures:correction/user-1/42/1.jpg')).toBeNull()
    expect(evidenceDisplaySource('captures:legacy/corrections/42/front.jpg')).toBeNull()
    expect(evidenceDisplaySource(null)).toBeNull()
  })

  it('prefers the capture path and still shows an installed public photo', () => {
    const path = 'correction/11111111-1111-1111-1111-111111111111/42/1790000000000.jpg'
    expect(evidenceToSign({
      evidence_capture_path: path,
      evidence_image_url: 'https://cdn.example/ignored.jpg',
    })).toEqual({ kind: 'captures', path })
    expect(evidenceToSign({
      evidence_capture_path: null,
      evidence_image_url: 'https://cdn.example/corrections/42/nutrition_facts/1.jpg',
    })).toEqual({
      kind: 'http',
      url: 'https://cdn.example/corrections/42/nutrition_facts/1.jpg',
    })
  })

  it('lets a reviewer apply a private product photo', () => {
    const row = blankCorrectionRow({
      id: '1',
      correction_type: 'product_image',
      proposed_value: {},
      evidence_capture_path: 'correction/11111111-1111-1111-1111-111111111111/42/1790000000000.jpg',
    })
    expect(canApproveAsIs(row)).toBe(true)
  })
})
