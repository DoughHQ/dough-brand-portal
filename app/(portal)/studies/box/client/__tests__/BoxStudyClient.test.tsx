import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyBoxDraft } from '@/lib/box/defaults'
import type { BoxPublishSuccessMeta } from '@/lib/box/types'
import BoxStudyClient from '../../BoxStudyClient'
import BoxOpenAudienceDialog from '../BoxOpenAudienceDialog'
import BoxPublishedDialog from '../BoxPublishedDialog'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
  }),
}))

function expectOrder(markup: string, markers: string[]) {
  let cursor = -1
  for (const marker of markers) {
    const index = markup.indexOf(marker, cursor + 1)
    expect(index, marker).toBeGreaterThan(cursor)
    cursor = index
  }
}

function publishedMeta(
  overrides: Partial<BoxPublishSuccessMeta> = {},
): BoxPublishSuccessMeta {
  return {
    missionId: 'mission-1',
    boxId: 'box-1',
    protocolId: null,
    campaignId: 'campaign-1',
    field_size: 3,
    unique_pairs: 3,
    session_count: 2,
    session2_interval_hours: 48,
    target_completions: 120,
    physical_units: 132,
    completion_overage_units: 12,
    eligibility_applied: false,
    box_status: 'open',
    publishedOpen: true,
    battle_question: null,
    battle_question_is_custom: false,
    taste_only: false,
    price_check_enabled: true,
    prototype_labels: [],
    ...overrides,
  }
}

describe('BoxStudyClient', () => {
  it('opens a new box on setup and keeps the section order', () => {
    const markup = renderToStaticMarkup(
      createElement(BoxStudyClient, {
        initialDraft: createEmptyBoxDraft(1),
        mode: 'new',
        isImpersonating: false,
      }),
    )

    expect(markup).toContain('class="concept-builder box-builder"')
    expect(markup).toContain('href="/studies"')
    expect(markup).not.toContain('role="dialog"')
    expect(markup).not.toContain('href="#box-audience"')
    expect(markup).not.toContain('Building as the impersonated brand')
    expectOrder(markup, [
      '← Studies',
      'Sampling box',
      'aria-label="Sampling box sections"',
      'href="#box-setup"',
      'Setup',
      'href="#box-field"',
      'Field',
      'href="#box-method"',
      'Questions',
      'id="box-method"',
      'Give the box study a name.',
      'Preview',
      'Publish box',
    ])
  })

  it('shows the study name and the impersonation line', () => {
    const draft = createEmptyBoxDraft(1)
    draft.title = 'Citrus box'
    const markup = renderToStaticMarkup(
      createElement(BoxStudyClient, {
        initialDraft: draft,
        mode: 'edit',
        isImpersonating: true,
      }),
    )

    expectOrder(markup, [
      'Sampling box',
      'Citrus box',
      'Building as the impersonated brand',
    ])
  })

  it('asks before publishing an open audience', () => {
    const markup = renderToStaticMarkup(
      createElement(BoxOpenAudienceDialog, {
        publishing: false,
        onAddRequirements: () => {},
        onPublish: () => {},
      }),
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('id="open-audience-title"')
    expectOrder(markup, [
      'Publish with an open audience?',
      'first come, first served',
      'Add requirements',
      'Publish anyway',
    ])
  })

  it('reports a live box, including taste-only labels', () => {
    const markup = renderToStaticMarkup(
      createElement(BoxPublishedDialog, {
        publishMeta: publishedMeta({
          taste_only: true,
          price_check_enabled: false,
          prototype_labels: [
            {
              combatant_ref: 1,
              prototype_id: 'proto-1',
              code: 'DS-1',
              display_name: 'Citrus sample',
              internal_label: 'Formula A',
              packaging: 'plain_sample',
            },
          ],
        }),
        onConfirm: () => {},
      }),
    )

    expect(markup).toContain('id="box-published-title"')
    expectOrder(markup, [
      'Box is live',
      'Plain samples made this study taste-only.',
      'Price checks are off.',
      'Printable study-sample labels (operators only)',
      'DS-1',
      'Citrus sample',
      'internal: Formula A',
      'plain sample',
      'Dough study sample.',
      'Products in box',
      '3',
      '120 respondents',
      '132 · 12 overage',
      'Open · claimable',
      'Open',
      'Taste · Which did you enjoy more?',
      'taste-only (shelf skipped)',
      'Back to studies',
    ])
    expect(markup).not.toContain('Which would you pick up?')
  })
})
