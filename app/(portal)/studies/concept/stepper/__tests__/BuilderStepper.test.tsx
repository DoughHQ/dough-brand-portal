import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import BuilderStepper from '../../BuilderStepper'

function renderStepper(
  steps: { id: string; label: string; done: boolean }[],
  label = 'Sampling box sections',
) {
  return renderToStaticMarkup(
    createElement(BuilderStepper, { steps, label }),
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

describe('BuilderStepper', () => {
  it('highlights the first unfinished step and numbers the rest', () => {
    const markup = renderStepper([
      { id: 'box-setup', label: 'Setup', done: true },
      { id: 'box-field', label: 'Field', done: false },
      { id: 'box-method', label: 'Questions', done: false },
    ])

    expect(markup).toContain('aria-label="Sampling box sections"')
    expect(markup).toContain('class="cb-stepper"')
    expect(markup).toContain('--cb-stepper-n:3')
    expect(markup).toContain('--cb-stepper-p:0.5')
    expect(markup).toContain('href="#box-field"')
    expect(markup).toContain('aria-current="step"')
    expectOrder(markup, [
      'data-done="true"',
      'href="#box-setup"',
      'class="cb-stepper-mark"',
      'M3.5 8.2 6.4 11 12.5 4.8',
      'Setup',
      'data-done="false"',
      'data-active="true"',
      'href="#box-field"',
      'aria-current="step"',
      '>2<',
      'Field',
      'href="#box-method"',
      '>3<',
      'Questions',
    ])
  })

  it('fills the bar when every step is done and when there is only one', () => {
    const done = renderStepper([
      { id: 'box-setup', label: 'Setup', done: true },
      { id: 'box-field', label: 'Field', done: true },
    ])
    const single = renderStepper([{ id: 'box-setup', label: 'Setup', done: false }])

    expect(done).toContain('--cb-stepper-p:1')
    expect(done).not.toContain('aria-current="step"')
    expect(single).toContain('--cb-stepper-n:1')
    expect(single).toContain('--cb-stepper-p:1')
    expect(single).toContain('aria-current="step"')
    expect(single).toContain('>1<')
  })
})
