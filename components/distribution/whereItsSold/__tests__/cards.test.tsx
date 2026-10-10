// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { partitionDistribution } from '@/lib/distribution/grouping'
import CoordCard from '../CoordCard'
import SeedSection from '../SeedSection'
import { report, row } from './fixtures'

afterEach(cleanup)

function handlers() {
  return {
    onConfirm: vi.fn(),
    onCorrect: vi.fn(),
    onDispute: vi.fn(),
    onClaim: vi.fn(),
    onRedeclare: vi.fn(),
    onWithdraw: vi.fn(),
    onDelist: vi.fn(),
  }
}

describe('distribution cards and seed section', () => {
  it('keeps a read-only card free of controls', () => {
    const target = row({
      awaiting_review: 1,
      needs_attention: true,
      shopper_reports: 1,
    })
    render(
      <CoordCard
        row={target}
        allRows={[target]}
        reports={[report()]}
        canEdit={false}
        busy={null}
        focused={false}
        {...handlers()}
      />,
    )

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Market Basket')).toBeTruthy()
    expect(screen.getByText(/1 shopper reported this/)).toBeTruthy()
  })

  it('dispatches card actions and disables all controls while busy', async () => {
    const user = userEvent.setup()
    const target = row({
      declaration_id: 55,
      brand_status: 'active',
      awaiting_review: 1,
      needs_attention: true,
      shopper_reports: 1,
      dough_seeded: false,
    })
    const callbacks = handlers()
    const { rerender } = render(
      <CoordCard
        row={target}
        allRows={[target]}
        reports={[report()]}
        canEdit
        busy={null}
        focused
        {...callbacks}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    await user.click(screen.getByRole('button', { name: 'Correct' }))
    await user.click(screen.getByRole('button', { name: 'Dispute' }))
    await user.click(screen.getByRole('button', { name: 'Withdraw' }))
    await user.click(screen.getByRole('button', { name: 'Mark delisted' }))
    expect(callbacks.onConfirm).toHaveBeenCalledWith(target, [report()])
    expect(callbacks.onCorrect).toHaveBeenCalledWith(target)
    expect(callbacks.onDispute).toHaveBeenCalledWith(target)
    expect(callbacks.onWithdraw).toHaveBeenCalledWith(target)
    expect(callbacks.onDelist).toHaveBeenCalledWith(target)

    rerender(
      <CoordCard
        row={target}
        allRows={[target]}
        reports={[report()]}
        canEdit
        busy="working"
        focused
        {...callbacks}
      />,
    )
    for (const button of screen.getAllByRole('button')) {
      expect((button as HTMLButtonElement).disabled).toBe(true)
    }
    expect(
      document.querySelector('.wis-coord')?.className.includes(
        'wis-coord--flash',
      ),
    ).toBe(true)
  })

  it('expands seeds, claims all, and delegates a seed claim', async () => {
    const user = userEvent.setup()
    const seed = row()
    const section = partitionDistribution([seed])[2]!
    const callbacks = handlers()
    const onToggle = vi.fn()
    const onClaimAll = vi.fn()
    const { rerender } = render(
      <SeedSection
        section={section}
        peek={{ names: ['Market Basket'], remaining: 0 }}
        open={false}
        onToggle={onToggle}
        claimable={[seed]}
        canEdit
        busy={null}
        allRows={[seed]}
        reports={[]}
        focusCoord={null}
        onClaimAll={onClaimAll}
        {...callbacks}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: /Dough found this at 1 more retailer/,
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Claim all (1)' }))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onClaimAll).toHaveBeenCalledOnce()

    rerender(
      <SeedSection
        section={section}
        peek={{ names: ['Market Basket'], remaining: 0 }}
        open
        onToggle={onToggle}
        claimable={[seed]}
        canEdit
        busy={null}
        allRows={[seed]}
        reports={[]}
        focusCoord={null}
        onClaimAll={onClaimAll}
        {...callbacks}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Claim this' }))
    expect(callbacks.onClaim).toHaveBeenCalledWith(seed)
  })
})
