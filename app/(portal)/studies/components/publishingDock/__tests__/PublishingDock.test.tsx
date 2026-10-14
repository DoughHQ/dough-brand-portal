import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PublishingDock from '../../PublishingDock'
import PublishingDockActions from '../PublishingDockActions'
import PublishingDockStatus, { type PublishingDockNeed } from '../PublishingDockStatus'

const needs: PublishingDockNeed[] = [
  { message: 'Add a product', anchor: 'product' },
  { message: 'Name the study', anchor: 'name' },
]

function renderDock(overrides: Partial<Parameters<typeof PublishingDock>[0]> = {}) {
  return renderToStaticMarkup(
    <PublishingDock
      ready={false}
      needs={needs}
      saveStatus="idle"
      saving={false}
      publishing={false}
      actionsLocked={false}
      publishMuted={false}
      publishLabel="Publish"
      onSave={() => undefined}
      onPublish={() => undefined}
      onScrollTo={() => undefined}
      stickyRef={() => undefined}
      {...overrides}
    />,
  )
}

describe('PublishingDock', () => {
  it('shows the next blocker before the publish action', () => {
    const markup = renderDock()

    expect(markup).toContain('class="cb-sticky"')
    expect(markup).toContain('data-ready="false"')
    expect(markup).toContain('data-tone="warn"')
    const left = markup.indexOf('>2 left<')
    const next = markup.indexOf('Add a product')
    const save = markup.indexOf('>Save<')
    const publish = markup.indexOf('>Publish<')
    expect(left).toBeGreaterThanOrEqual(0)
    expect(next).toBeGreaterThan(left)
    expect(save).toBeGreaterThan(next)
    expect(publish).toBeGreaterThan(save)
    expect(markup).not.toContain('role="listbox"')
    expect(markup).not.toContain('Name the study')
  })

  it('says the study is ready to publish', () => {
    const markup = renderDock({ ready: true, needs: [], readyFacts: '  12 completions  ' })

    expect(markup).toContain('data-ready="true"')
    expect(markup).toContain('>12 completions<')
    expect(markup).toContain('✓')
    expect(markup).not.toContain('Ready to publish')
    expect(markup).not.toContain('cb-dock-next')
  })

  it('holds the status after an order exists', () => {
    const markup = renderDock({ ready: true, holdLabel: 'Awaiting payment' })

    expect(markup).toContain('data-ready="false"')
    expect(markup).toContain('>Awaiting payment<')
    expect(markup).not.toContain('cb-dock-next')
    expect(markup).not.toContain('cb-dock-status-chevron')
  })
})

describe('PublishingDockStatus', () => {
  it('lists every remaining need when the panel is open', () => {
    const markup = renderToStaticMarkup(
      <PublishingDockStatus
        ready={false}
        needs={needs}
        readyFacts={null}
        listOpen
        panelId="needs-panel"
        statusRef={() => undefined}
        onToggleList={() => undefined}
        onGoTo={() => undefined}
      />,
    )

    expect(markup).toContain('>2 left<')
    expect(markup).toContain('aria-expanded="true"')
    expect(markup).toContain('id="needs-panel"')
    expect(markup).toContain('aria-label="Still needed"')
    const first = markup.indexOf('Add a product')
    const second = markup.indexOf('Name the study')
    expect(second).toBeGreaterThan(first)
    expect(markup).toContain('▴')
  })
})

describe('PublishingDockActions', () => {
  it('shows sync and save ahead of publish', () => {
    const markup = renderToStaticMarkup(
      <PublishingDockActions
        ready={false}
        saveStatus="saving"
        saving
        publishing={false}
        actionsLocked={false}
        publishDisabled={false}
        publishMuted={false}
        publishLabel="Publish"
        publishBusyLabel="Publishing…"
        showPreview
        previewLabel="Preview"
        onSave={() => undefined}
        onPublish={() => undefined}
        onPreview={() => undefined}
      />,
    )

    const sync = markup.indexOf('Syncing…')
    const save = markup.indexOf('>Saving…<')
    const preview = markup.indexOf('>Preview<')
    const publish = markup.indexOf('>Publish<')
    expect(sync).toBeGreaterThanOrEqual(0)
    expect(save).toBeGreaterThan(sync)
    expect(preview).toBeGreaterThan(save)
    expect(publish).toBeGreaterThan(preview)
    expect(markup).toContain('data-tone="neutral"')
  })

  it('reports a failed sync and a busy publish', () => {
    const markup = renderToStaticMarkup(
      <PublishingDockActions
        ready
        saveStatus="error"
        saving={false}
        publishing
        actionsLocked={false}
        publishDisabled={false}
        publishMuted={false}
        publishLabel="Publish"
        publishBusyLabel="Publishing…"
        showPreview={false}
        previewLabel="Preview"
        onSave={() => undefined}
        onPublish={() => undefined}
      />,
    )

    expect(markup).toContain('data-tone="error"')
    expect(markup).toContain('Sync failed')
    expect(markup).toContain('>Publishing…<')
    expect(markup).toContain('data-muted="true"')
    expect(markup).not.toContain('>Preview<')
  })
})
