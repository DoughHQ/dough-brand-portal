import { createElement, type Dispatch, type SetStateAction } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ApplicationQueueBanner, type QueueBanner } from '../ApplicationQueueBanner'
import { ApplicationQueueEmpty } from '../ApplicationQueueEmpty'
import { ApplicationQueueError } from '../ApplicationQueueError'
import { ApplicationQueueHeader } from '../ApplicationQueueHeader'
import { ApplicationQueueImpersonation } from '../ApplicationQueueImpersonation'
import { ApplicationQueueLoadMore } from '../ApplicationQueueLoadMore'

const setBanner: Dispatch<SetStateAction<QueueBanner | null>> = () => {}

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

describe('Application queue chrome', () => {
  it('introduces the queue and counts the loaded rows', () => {
    const markup = renderToStaticMarkup(
      createElement(ApplicationQueueHeader, {
        pendingCount: 2,
        total: 4,
        refreshing: false,
        refresh: () => {},
      }),
    )

    expect(markup).toContain('href="/admin/ownership-corrections"')
    expect(markup).toContain('>Refresh<')
    expect(markup).not.toContain('Refreshing')
    expect(markup).not.toContain('disabled=""')
    expectOrder(markup, [
      'Ops',
      'Brand applications',
      'Requests to join Runoff.',
      'Approve &amp; invite',
      'it&#x27;s new',
      'Reject',
      '← Ownership corrections',
      '2 pending · 4 total',
    ])
  })

  it('disables refresh while a reload is in flight and hides the count when the queue is empty', () => {
    const refreshing = renderToStaticMarkup(
      createElement(ApplicationQueueHeader, {
        pendingCount: 0,
        total: 1,
        refreshing: true,
        refresh: () => {},
      }),
    )
    expect(refreshing).toContain('>Refreshing…<')
    expect(refreshing).toContain('disabled=""')
    expect(refreshing).toContain('cursor:default')

    const empty = renderToStaticMarkup(
      createElement(ApplicationQueueHeader, {
        pendingCount: 0,
        total: 0,
        refreshing: false,
        refresh: () => {},
      }),
    )
    expect(empty).not.toContain('pending ·')
    expect(renderToStaticMarkup(createElement(ApplicationQueueEmpty))).toContain('Queue is clear')
    expect(renderToStaticMarkup(createElement(ApplicationQueueEmpty))).toContain('No applications yet.')
  })

  it('shows a success banner without dismiss and a warning with its detail', () => {
    const success = renderToStaticMarkup(
      createElement(ApplicationQueueBanner, {
        banner: { message: 'Invite sent to ada@example.com.', tone: 'success' },
        setBanner,
      }),
    )
    expect(success).toContain('Invite sent to ada@example.com.')
    expect(success).toContain('var(--sage-soft, rgba(74, 103, 65, 0.12))')
    expect(success).not.toContain('>Dismiss<')
    expect(renderToStaticMarkup(createElement(ApplicationQueueBanner, { banner: null, setBanner }))).toBe('')

    const warn = renderToStaticMarkup(
      createElement(ApplicationQueueBanner, {
        banner: {
          message: 'Approved, but the invite email didn’t send. Use Resend.',
          tone: 'warn',
          detail: 'mailbox full',
        },
        setBanner,
      }),
    )
    expectOrder(warn, [
      'Approved, but the invite email didn’t send. Use Resend.',
      'mailbox full',
      'Dismiss',
    ])
    expect(warn).toContain('var(--amber-pale, rgba(192,120,24,0.12))')

    const info = renderToStaticMarkup(
      createElement(ApplicationQueueBanner, {
        banner: { message: 'No pending invite to revoke.', tone: 'info' },
        setBanner,
      }),
    )
    expect(info).toContain('border:1px solid var(--ink-10)')
    expect(info).toContain('>Dismiss<')

    const error = renderToStaticMarkup(
      createElement(ApplicationQueueBanner, {
        banner: { message: 'Couldn’t reach the server.', tone: 'error' },
        setBanner,
      }),
    )
    expect(error).toContain('rgba(180, 35, 24, 0.08)')
    expect(error).toContain('>Dismiss<')
  })

  it('keeps impersonation and load errors separate from an idle load-more button', () => {
    expect(renderToStaticMarkup(createElement(ApplicationQueueImpersonation, { impersonating: false }))).toBe('')
    expect(
      renderToStaticMarkup(createElement(ApplicationQueueImpersonation, { impersonating: true })),
    ).toContain('Leave the brand workspace (stop impersonating) before reviewing applications.')
    expect(renderToStaticMarkup(createElement(ApplicationQueueError, { error: null }))).toBe('')
    expect(renderToStaticMarkup(createElement(ApplicationQueueError, { error: 'Couldn’t load more.' }))).toContain(
      'Couldn’t load more.',
    )

    const idle = renderToStaticMarkup(
      createElement(ApplicationQueueLoadMore, { loading: false, loadMore: () => {} }),
    )
    expect(idle).toContain('class="btn btn-secondary"')
    expect(idle).toContain('>Load more<')
    expect(idle).not.toContain('disabled=""')

    const loading = renderToStaticMarkup(
      createElement(ApplicationQueueLoadMore, { loading: true, loadMore: () => {} }),
    )
    expect(loading).toContain('>Loading…<')
    expect(loading).toContain('disabled=""')
    expect(loading).not.toContain('>Load more<')
  })
})
