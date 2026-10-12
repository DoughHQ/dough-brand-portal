import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  createEmptyBoxDraft,
  createEmptyBoxFieldRow,
} from '@/lib/box/defaults'
import { IHUT_DEFAULT_ATTRIBUTES, IHUT_DEFAULT_SUCCESS_BARS } from '@/lib/box/method'
import MethodSection from '../../MethodSection'
import AttributeEditor from '../AttributeEditor'
import SuccessBarsEditor from '../SuccessBarsEditor'
import { PRODUCT_NAME } from '@/lib/brand'

vi.mock('server-only', () => ({}))

function pressed(markup: string, label: string): boolean {
  const button = markup.match(new RegExp(`<button[^>]*>${label}</button>`))
  return button?.[0].includes('aria-pressed="true"') ?? false
}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('MethodSection', () => {
  it('opens shelf battles and keeps the locked day-one order', () => {
    const markup = renderToStaticMarkup(
      createElement(MethodSection, {
        draft: createEmptyBoxDraft(1),
        onChange: () => {},
      }),
    )

    expect(markup).toContain('id="box-method"')
    expect(markup).toContain('Add at least 2 products to see length')
    expect(markup).not.toContain('How much is left?')
    expect(markup).not.toContain('Default 48 hours.')
    expectOrder(markup, [
      'Questions',
      `The ${PRODUCT_NAME} in-home method`,
      'id="ihut-step-shelf_battles"',
      'Battles',
      'Which would you pick up?',
      'Add products to the field to see who battles.',
      'Expectation',
      'Try each product',
      'Taste battles',
      'Buy order',
      'Price check',
      'Best and worst',
      'Your questions',
      'Success bars',
      'Taste 50% · Liking 50% · Buy 50%',
      'Day 2: Live with it',
      '+40% of the Day 1 household fee',
    ])
  })

  it('skips shelf and expectation when a seat is a plain sample', () => {
    const seat = createEmptyBoxFieldRow()
    seat.kind = 'prototype'
    seat.prototype_id = 'proto-1'
    seat.packaging = 'plain_sample'
    const draft = createEmptyBoxDraft(1)
    draft.fieldProducts = [seat]

    const markup = renderToStaticMarkup(
      createElement(MethodSection, {
        draft,
        onChange: () => {},
      }),
    )

    expect(markup).toContain('This box will run taste-only')
    expect(markup).toContain('id="ihut-step-taste_battles"')
    expect(markup).toContain('Which did you enjoy more?')
    expect(markup).not.toContain('id="ihut-step-shelf_battles"')
    expect(markup).not.toContain('id="ihut-step-expectation"')
    expect(markup).not.toContain('Which would you pick up?')
  })

  it('shows the locked day-two screens when live-with-it is on', () => {
    const draft = createEmptyBoxDraft(1)
    draft.day2LiveWithIt = true

    const markup = renderToStaticMarkup(
      createElement(MethodSection, {
        draft,
        onChange: () => {},
      }),
    )

    expect(markup).toContain('id="box-log-sessions"')
    expect(markup).toContain('Default 48 hours.')
    expectOrder(markup, [
      'Day 2: Live with it',
      'How much is left?',
      'Grown on you?',
      'Packaging after a few days',
      'Still your pick?',
      'Price check again',
      'One thing',
    ])
  })

  it('warns when the day-two gap is under 24 hours', () => {
    const draft = createEmptyBoxDraft(1)
    draft.day2LiveWithIt = true
    draft.session2IntervalHours = 12

    const markup = renderToStaticMarkup(
      createElement(MethodSection, {
        draft,
        onChange: () => {},
      }),
    )

    expect(markup).toContain('Must be at least 24 hours.')
    expect(markup).not.toContain('Default 48 hours.')
  })

  it('presses the default attribute checks', () => {
    const markup = renderToStaticMarkup(
      createElement(AttributeEditor, {
        selected: IHUT_DEFAULT_ATTRIBUTES,
        onToggle: () => {},
      }),
    )

    expect(markup).toContain('Pick 1–3 just-right checks')
    expect(pressed(markup, 'Sweetness')).toBe(true)
    expect(pressed(markup, 'Saltiness')).toBe(true)
    expect(pressed(markup, 'Texture')).toBe(false)
    expect(pressed(markup, 'Flavor strength')).toBe(true)
  })

  it('explains that the price bar stays off without shelf prices', () => {
    const markup = renderToStaticMarkup(
      createElement(SuccessBarsEditor, {
        bars: IHUT_DEFAULT_SUCCESS_BARS,
        onChange: () => {},
        priceCheckEnabled: false,
      }),
    )

    expect(markup).toContain('Price checks are off')
    expect(markup).toContain(
      'Disabled until every packaged seat has a positive shelf price.',
    )
    expect(markup).toContain('Taste win share · 50%')
    expect(markup).toContain('disabled=""')
  })
})
