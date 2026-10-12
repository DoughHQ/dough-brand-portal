import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ConceptArmImageUploader from '../../ConceptArmImageUploader'

function renderUploader(
  overrides: Partial<Parameters<typeof ConceptArmImageUploader>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(ConceptArmImageUploader, {
      brandId: 1,
      draftId: 'draft-1',
      armLabel: 'A',
      imageUrl: null,
      imageFilename: null,
      onChange: () => {},
      ...overrides,
    }),
  )
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('ConceptArmImageUploader', () => {
  it('opens the hero drop zone without a pack-image label', () => {
    const markup = renderUploader({ variant: 'hero', requiredHint: true })

    expect(markup).toContain('@keyframes concept-spin{to{transform:rotate(360deg)}}')
    expect(markup).toContain('accept="image/png,image/jpeg,image/jpg,image/webp"')
    expect(markup).toContain('Add pack image')
    expect(markup).not.toContain('Pack image')
    expect(markup).not.toContain('Pack image · Required')
    expect(markup).not.toContain('Choose a file or drag it here')
    expect(markup).not.toContain('PNG, JPG, or WebP · under 15 MB')
    expect(markup).not.toContain('cb-concept-stage')
    expectOrder(markup, [
      '@keyframes concept-spin',
      'type="file"',
      'Add pack image',
    ])
  })

  it('uses the compact drop zone and marks a required pack image', () => {
    const plain = renderUploader()
    const required = renderUploader({ requiredHint: true })

    expect(plain).toContain('Pack image')
    expect(plain).not.toContain('Pack image · Required')
    expect(plain).toContain('Choose a file or drag it here')
    expect(plain).toContain('PNG, JPG, or WebP · under 15 MB')
    expect(plain).not.toContain('Add pack image')
    expect(required).toContain('Pack image · Required')
    expectOrder(plain, [
      'Pack image',
      'type="file"',
      'Choose a file or drag it here',
      'PNG, JPG, or WebP · under 15 MB',
    ])
  })

  it('shows a hero stage placeholder before the signed preview resolves', () => {
    const markup = renderUploader({
      variant: 'hero',
      imageUrl: 'stimuli/brand/midnight.png',
      imageFilename: 'Midnight Cocoa.png',
    })

    expect(markup).toContain('class="cb-concept-stage"')
    expect(markup).toContain('class="cb-concept-stage-frame"')
    expect(markup).not.toContain('is-over')
    expect(markup).toContain('class="cb-concept-stage-empty"')
    expect(markup).toContain('class="cb-concept-stage-replace"')
    expect(markup).toContain('Replace')
    expect(markup).not.toContain('Replacing')
    expect(markup).not.toContain('Remove')
    expect(markup).not.toContain('Add pack image')
    expect(markup).not.toContain('Midnight Cocoa.png')
    expectOrder(markup, [
      'type="file"',
      'class="cb-concept-stage"',
      'class="cb-concept-stage-empty"',
      'Pack image',
      'Replace',
    ])
  })

  it('names a compact image from the filename, then the storage leaf', () => {
    const named = renderUploader({
      imageUrl: 'stimuli/brand/midnight.png',
      imageFilename: 'Midnight Cocoa.png',
    })
    const leaf = renderUploader({
      imageUrl: 'stimuli/brand/midnight.png',
      imageFilename: null,
    })

    expect(named).toContain('title="Midnight Cocoa.png"')
    expect(named).toContain('Midnight Cocoa.png')
    expect(named).toContain('Ready for the study')
    expect(named).toContain('Replace')
    expect(named).toContain('Remove')
    expect(named).toContain('—')
    expect(named).not.toContain('Drop to replace')
    expect(named).not.toContain('cb-concept-stage')
    expect(leaf).toContain('title="midnight.png"')
    expect(leaf).not.toContain('Midnight Cocoa.png')
    expectOrder(named, [
      'Pack image',
      'type="file"',
      'title="Midnight Cocoa.png"',
      'Ready for the study',
      'Replace',
      'Remove',
    ])
  })

  it('disables the file input when the uploader is disabled', () => {
    const markup = renderUploader({ disabled: true, variant: 'hero' })

    expect(markup).toContain('disabled=""')
    expect(markup).toContain('Add pack image')
  })
})
