import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ConfirmDialog from '../../ConfirmDialog'

const idle = {
  title: 'Close study?',
  body: '“Oat carton” will mark as completed.',
  confirmLabel: 'Close study',
  onConfirm: () => undefined,
  onCancel: () => undefined,
}

describe('ConfirmDialog', () => {
  it('stays closed until it is opened', () => {
    expect(renderToStaticMarkup(<ConfirmDialog open={false} {...idle} />)).toBe('')
  })

  it('puts the title ahead of cancel and confirm', () => {
    const markup = renderToStaticMarkup(<ConfirmDialog open {...idle} />)

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('id="portal-confirm-title"')
    const title = markup.indexOf('>Close study?<')
    const body = markup.indexOf('“Oat carton” will mark as completed.')
    const cancel = markup.indexOf('>Cancel<')
    const confirm = markup.indexOf('>Close study<')
    expect(title).toBeGreaterThanOrEqual(0)
    expect(body).toBeGreaterThan(title)
    expect(cancel).toBeGreaterThan(body)
    expect(confirm).toBeGreaterThan(cancel)
    expect(markup).toContain('background:var(--sage)')
    expect(markup).not.toContain('disabled')
  })

  it('uses the caution and destructive tones', () => {
    const caution = renderToStaticMarkup(<ConfirmDialog open tone="caution" {...idle} />)
    const destructive = renderToStaticMarkup(
      <ConfirmDialog open tone="destructive" {...idle} confirmLabel="Delete forever" />,
    )

    expect(caution).toContain('background:var(--ink)')
    expect(destructive).toContain('background:#8B2E2E')
    expect(destructive).toContain('>Delete forever<')
  })

  it('shows working while the confirm is busy', () => {
    const markup = renderToStaticMarkup(<ConfirmDialog open busy {...idle} />)

    expect(markup).toContain('>Working…<')
    expect(markup).toContain('disabled=""')
    expect(markup).not.toContain('>Close study<')
    expect(markup).toContain('>Cancel<')
  })

  it('hides the confirm control when hideConfirm is set', () => {
    const markup = renderToStaticMarkup(
      <ConfirmDialog open hideConfirm {...idle} cancelLabel="Close" />,
    )
    expect(markup).toContain('>Close<')
    expect(markup).not.toContain('>Close study<')
  })
})
