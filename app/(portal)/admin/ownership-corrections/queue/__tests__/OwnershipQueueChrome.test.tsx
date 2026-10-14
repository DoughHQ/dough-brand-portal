import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { OwnershipQueueEmpty } from '../OwnershipQueueEmpty'
import { OwnershipQueueHead } from '../OwnershipQueueHead'
import { OwnershipQueueLoadMore } from '../OwnershipQueueLoadMore'
import { OwnershipQueueNotices } from '../OwnershipQueueNotices'

describe('ownership queue chrome', () => {
  it('names the queue and links back to product corrections', () => {
    const html = renderToStaticMarkup(<OwnershipQueueHead refresh={vi.fn()} />)
    expect(html).toContain('>Ops<')
    expect(html).toContain('>Brand ownership corrections<')
    expect(html).toContain('the brand’s recorded parent')
    expect(html).toContain('href="/admin/corrections"')
    expect(html).toContain('← Product corrections')
    expect(html).toContain('>Refresh<')
  })

  it('shows a flash and an error, or nothing', () => {
    const shown = renderToStaticMarkup(
      <OwnershipQueueNotices flash="Accepted and applied." error="Couldn’t load more." />,
    )
    expect(shown).toContain('>Accepted and applied.<')
    expect(shown).toContain('Couldn’t load more.')
    expect(shown).toContain('background:var(--sage-soft, rgba(74, 103, 65, 0.12))')
    expect(renderToStaticMarkup(<OwnershipQueueNotices flash={null} error={null} />)).toBe('')
  })

  it('says the queue is clear and offers another page', () => {
    expect(renderToStaticMarkup(<OwnershipQueueEmpty />)).toContain('Queue is clear')
    const more = renderToStaticMarkup(
      <OwnershipQueueLoadMore
        loadingMore={false}
        cursor={{ submittedAt: '2026-10-11T12:00:00.000Z', id: 'c1' }}
        loadMore={vi.fn()}
      />,
    )
    expect(more).toContain('>Load more<')
    const waiting = renderToStaticMarkup(
      <OwnershipQueueLoadMore loadingMore cursor={null} loadMore={vi.fn()} />,
    )
    expect(waiting).toContain('>Loading…<')
    expect(waiting).toContain('disabled=""')
  })
})
