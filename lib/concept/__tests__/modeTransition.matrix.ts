/**
 * Section 0 Pass 1 — state-transition regression matrix.
 *
 * Covers §42 (mode switching), §43 (category reset) and §44 (variant loss).
 * Run: npx esbuild lib/concept/__tests__/modeTransition.matrix.ts --bundle \
 *        --platform=node --format=cjs --outfile=/tmp/mt.cjs --alias:@=. && node /tmp/mt.cjs
 */

import { it, expect } from 'vitest'
import { createEmptyConceptDraft, newConceptArm } from '../defaults'
import type { ConceptStudyDraft, PackagingTemplateConfig } from '../types'
import { getConceptFieldSize } from '../fieldSize'
import {
  CATEGORY_RESET_BODY,
  armsLostByModeSwitch,
  categoryResetConfirmLabel,
  categoryResetTitle,
  modeSwitchConfirmLabel,
  modeSwitchConfirmTitle,
  categoryResetLoses,
  categoryResetMessage,
  isConfiguredArm,
  modeSwitchLossMessage,
  normalizeSeededArms,
  planModeTransition,
  rehydrateCategoryDerived,
  withDerivedCategoryPlural,
} from '../modeTransition'

/**
 * Each assertion registers a real test. Conditions are evaluated eagerly, in
 * order, as the suite is collected — so state threaded between assertions
 * behaves exactly as it did when these ran as a script.
 */
let section = ''
const sec = (s: string) => {
  section = s
}
const ok = (c: boolean, m: string, d?: unknown) => {
  const name = section ? `${section} · ${m}` : m
  const detail = d === undefined ? '' : ` — got ${JSON.stringify(d)}`
  it(name, () => {
    expect(c, `${name}${detail}`).toBe(true)
  })
}

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const NODE = 'Ice Cream'

function fullTemplate(): PackagingTemplateConfig {
  return {
    category_plural: 'ice cream',
    pack_size: '4-pack',
    price_display: '$4.99',
    decoy_option: 'Frostwyn',
    verification_options: [
      { id: 'brand:1', label: 'Ben & Jerry’s', brand_id: 1 },
      { id: 'brand:2', label: 'Talenti', brand_id: 2 },
    ] as PackagingTemplateConfig['verification_options'],
    legibility_options: [
      { id: 'tax:2', label: 'Frozen Yogurt', taxonomy_node_id: 2 },
      { id: 'tax:3', label: 'Sorbet', taxonomy_node_id: 3 },
    ] as PackagingTemplateConfig['legibility_options'],
    expected_price: '4.99',
    price_answer_mode: 'bands',
  }
}

function configuredDraft(armCount = 3): ConceptStudyDraft {
  const arms = Array.from({ length: armCount }, (_, i) => ({
    ...newConceptArm(i),
    display_name: `Variant ${String.fromCharCode(65 + i)}`,
    image_url: `https://cdn/pack-${i}.png`,
  }))
  return createEmptyConceptDraft({
    stimulusMode: 'package',
    taxonomyNodeId: 9330054,
    templateConfig: fullTemplate(),
    conceptArms: arms,
  })
}

/* ========================================================================== */
{
  let d = configuredDraft(1)
  const before = { ...d.templateConfig }

  const toPrice = planModeTransition(d, 'price', true)
  ok(toPrice.kind === 'apply', '→ Price applies without a confirmation (1 arm, nothing lost)', toPrice.kind)
  d = (toPrice as { next: ConceptStudyDraft }).next

  ok(d.templateConfig.category_plural === 'ice cream', 'phrasing survives → Price', d.templateConfig.category_plural)
  ok(d.templateConfig.pack_size === '4-pack', 'pack size survives → Price', d.templateConfig.pack_size)
  ok(d.templateConfig.legibility_options.length === 2, 'legibility survives → Price', d.templateConfig.legibility_options.length)
  ok(d.taxonomyNodeId === 9330054, 'category itself untouched', d.taxonomyNodeId)

  const back = planModeTransition(d, 'package', true)
  d = (back as { next: ConceptStudyDraft }).next

  ok(d.templateConfig.category_plural === 'ice cream', 'phrasing survives → Packaging', d.templateConfig.category_plural)
  ok(d.templateConfig.pack_size === '4-pack', 'pack size survives → Packaging', d.templateConfig.pack_size)
  ok(d.templateConfig.legibility_options.length === 2, 'legibility survives → Packaging', d.templateConfig.legibility_options.length)
  ok(eq(d.templateConfig, before), 'ENTIRE templateConfig is byte-identical after the round trip')
}

sec('§9/§42 · Section 2 template work survives a mode switch')
{
  let d = configuredDraft(1)
  for (const mode of ['price', 'package'] as const) {
    d = (planModeTransition(d, mode, true) as { next: ConceptStudyDraft }).next
  }
  ok(d.templateConfig.expected_price === '4.99', 'expected_price survives', d.templateConfig.expected_price)
  ok(d.templateConfig.verification_options.length === 2, 'verification_options survive', d.templateConfig.verification_options.length)
  ok(d.templateConfig.decoy_option === 'Frostwyn', 'decoy_option survives', d.templateConfig.decoy_option)
  ok(d.templateConfig.price_display === '$4.99', 'price_display survives', d.templateConfig.price_display)
}

sec('§2 · no wholesale reset remains')
{
  const d = configuredDraft(1)
  const next = (planModeTransition(d, 'price', true) as { next: ConceptStudyDraft }).next
  const emptied = Object.entries(next.templateConfig).filter(([, v]) =>
    v === '' || (Array.isArray(v) && v.length === 0)
  )
  ok(emptied.length === 0, 'no template field was emptied by the switch', emptied.map(([k]) => k))
}

sec('§11/§44 · configured variants are not silently deleted')
{
  const d = configuredDraft(3)
  const plan = planModeTransition(d, 'price', true)
  ok(plan.kind === 'confirm', '3 configured variants → Price asks first', plan.kind)
  // Pass 3 moved the question into the dialog title, so the body states only the
  // consequence. Same count, no trailing "Continue?".
  ok(
    plan.kind === 'confirm' &&
      plan.message === 'Price studies use one product. Switching will keep one product and remove 2 configured variants.',
    'message states the real count',
    plan.kind === 'confirm' ? plan.message : null
  )
  ok(armsLostByModeSwitch(d.conceptArms, 'price').length === 2, 'exactly 2 arms identified as lost')
  ok(/remove 1 configured variant\./.test(modeSwitchLossMessage(1, 'price')), 'singular copy is singular', modeSwitchLossMessage(1, 'price'))

  // §16 — the plan is inert until applied. The source draft is untouched.
  ok(d.conceptArms.length === 3 && d.stimulusMode === 'package', 'cancel path: planning mutated nothing', {
    arms: d.conceptArms.length,
    mode: d.stimulusMode,
  })

  const applied = (plan as { next: ConceptStudyDraft }).next
  ok(applied.conceptArms.length === 1, 'confirm path: exactly one product kept', applied.conceptArms.length)
  ok(applied.conceptArms[0]!.display_name === 'Variant A', 'the kept product is the first', applied.conceptArms[0]!.display_name)
}

sec('§11 · blank rows normalize silently, work never does')
{
  // Superseded by Pass 3: fresh drafts no longer seed anything, so this now
  // exercises the LEGACY shape explicitly rather than relying on the default.
  const blanks = createEmptyConceptDraft({
    stimulusMode: null,
    conceptArms: [newConceptArm(0), newConceptArm(1)],
  })
  ok(blanks.conceptArms.length === 2, 'a legacy draft carrying two blank seed rows', blanks.conceptArms.length)
  const plan = planModeTransition(blanks, 'package', true)
  ok(plan.kind === 'apply', 'blank seed debt needs no confirmation', plan.kind)
  ok((plan as { next: ConceptStudyDraft }).next.conceptArms.length === 1, '§12 · and collapses to one, never two', (plan as { next: ConceptStudyDraft }).next.conceptArms.length)
  ok(createEmptyConceptDraft().conceptArms.length === 0, 'Pass 3 · while a fresh draft seeds none at all', createEmptyConceptDraft().conceptArms.length)

  const oneConfigured = createEmptyConceptDraft({
    conceptArms: [{ ...newConceptArm(0), display_name: 'Real' }, newConceptArm(1)],
  })
  const plan2 = planModeTransition(oneConfigured, 'package', true)
  ok(
    (plan2 as { next: ConceptStudyDraft }).next.conceptArms.length === 2,
    'a blank sitting next to real work is left alone',
    (plan2 as { next: ConceptStudyDraft }).next.conceptArms.length
  )
  ok(!isConfiguredArm(newConceptArm(0)), 'a fresh arm is not "configured"')
  ok(isConfiguredArm({ ...newConceptArm(0), image_url: 'x' }), 'an image alone counts as configured')
  const solo = [newConceptArm(0)]
  ok(normalizeSeededArms(solo) === solo, 'a single arm is returned untouched (same identity)')
}

sec('Pass 3 §1-§5 · an empty study is actually empty')
{
  const fresh = createEmptyConceptDraft()
  ok(fresh.conceptArms.length === 0, 'fresh draft seeds zero concept arms', fresh.conceptArms.length)
  ok(fresh.products.length === 0, 'and zero competitors', fresh.products.length)
  ok(fresh.scoringRounds === 1, '§9 · scoring rounds stay sane at zero arms', fresh.scoringRounds)
  ok(!!fresh.floor, '§10 · the floor question still builds without a leader arm')
  ok(/Would you actually buy this/.test(String(fresh.floor?.config.prompt)), 'and falls back to "this"', fresh.floor?.config.prompt)

  const toPackaging = planModeTransition(fresh, 'package', true)
  ok(toPackaging.kind === 'apply', '§5 · choosing Packaging needs no confirmation', toPackaging.kind)
  ok((toPackaging as { next: ConceptStudyDraft }).next.conceptArms.length === 0, '§5 · Packaging creates no product', (toPackaging as { next: ConceptStudyDraft }).next.conceptArms.length)

  const toPrice = planModeTransition(fresh, 'price', true)
  ok((toPrice as { next: ConceptStudyDraft }).next.conceptArms.length === 0, '§5 · Price creates no product', (toPrice as { next: ConceptStudyDraft }).next.conceptArms.length)

  ok(getConceptFieldSize(fresh) === 0, '§8 · fresh draft occupies zero field seats', getConceptFieldSize(fresh))
  const withOne = { ...fresh, conceptArms: [newConceptArm(0)] }
  ok(getConceptFieldSize(withOne) === 1, '§8 · one seat after Add your product', getConceptFieldSize(withOne))
}

sec('Pass 3 §7/§33 · legacy seed debt is still handled, separately')
{
  const legacy = createEmptyConceptDraft({ conceptArms: [newConceptArm(0), newConceptArm(1)] })
  ok(normalizeSeededArms(legacy.conceptArms).length === 1, 'two blank legacy rows collapse to one')
  const mixed = [{ ...newConceptArm(0), display_name: 'Real' }, newConceptArm(1)]
  ok(normalizeSeededArms(mixed).length === 2, 'a blank beside real work is still untouched')
}

sec('Pass 3 §14-§16 · dialog copy names the real consequence')
{
  ok(categoryResetTitle('change') === 'Change category?', 'change title', categoryResetTitle('change'))
  ok(categoryResetTitle('clear') === 'Clear category?', 'clear title', categoryResetTitle('clear'))
  ok(categoryResetConfirmLabel('change') === 'Change category', 'change action names itself')
  ok(categoryResetConfirmLabel('clear') === 'Clear category', 'clear action names itself')
  ok(
    CATEGORY_RESET_BODY === 'This will reset category-specific questionnaire wording and legibility options.',
    'shared body',
    CATEGORY_RESET_BODY
  )
  ok(!/pack size|expected price|verification/i.test(CATEGORY_RESET_BODY), '§14 · does not claim fields that now survive')
  ok(!/are you sure/i.test(CATEGORY_RESET_BODY), 'never "Are you sure?"')

  ok(modeSwitchConfirmTitle('price') === 'Switch to Price?', 'mode title', modeSwitchConfirmTitle('price'))
  ok(modeSwitchConfirmLabel('price') === 'Switch to Price', 'mode action names itself')
  ok(
    modeSwitchLossMessage(2, 'price') === 'Price studies use one product. Switching will keep one product and remove 2 configured variants.',
    'mode body states the count',
    modeSwitchLossMessage(2, 'price')
  )
  ok(/remove 1 configured variant\./.test(modeSwitchLossMessage(1, 'price')), 'singular stays singular', modeSwitchLossMessage(1, 'price'))
}

sec('§11 · blind modes still null prices and force blind posture')
{
  const d = createEmptyConceptDraft({
    conceptArms: [{ ...newConceptArm(0), display_name: 'A', frozen_price: '4.99' }],
    pricePosture: 'realistic',
  })
  const next = (planModeTransition(d, 'package', true) as { next: ConceptStudyDraft }).next
  ok(next.conceptArms[0]!.frozen_price === null, 'arm price nulled entering a blind mode')
  ok(next.pricePosture === 'blind', 'price posture forced blind', next.pricePosture)
  ok(next.sessionCount === 1, 'session count normalized to 1')
}

sec('§1 · non-publishable modes and no-ops')
{
  const d = configuredDraft(1)
  ok(planModeTransition(d, 'flavor', false).kind === 'noop', 'non-publishable mode is refused')
  ok(planModeTransition(d, 'package', true).kind === 'noop', 'selecting the current mode is a no-op')
}

sec('§5/§32 · phrasing derives at the state layer, never from a blur')
{
  const empty = { ...fullTemplate(), category_plural: '' }
  ok(withDerivedCategoryPlural(empty, NODE).category_plural === 'ice cream', 'empty phrasing re-derives from the node')
  const custom = { ...fullTemplate(), category_plural: 'artisanal gelato' }
  ok(withDerivedCategoryPlural(custom, NODE).category_plural === 'artisanal gelato', 'a custom phrasing is never overwritten')
  ok(withDerivedCategoryPlural(custom, NODE) === custom, 'no-op returns the same object identity')

  const d = createEmptyConceptDraft({ taxonomyNodeId: 9330054, templateConfig: empty })
  ok(rehydrateCategoryDerived(d, NODE).templateConfig.category_plural === 'ice cream', 'rehydrate fills an empty phrasing')
  const noCat = createEmptyConceptDraft({ taxonomyNodeId: null, templateConfig: empty })
  ok(rehydrateCategoryDerived(noCat, NODE) === noCat, 'no category → nothing derived')
}

sec('§13/§15/§43 · one guard, two paths, honest copy')
{
  const derivedOnly = { ...fullTemplate(), category_plural: 'ice cream', legibility_options: [] as PackagingTemplateConfig['legibility_options'] }
  ok(!categoryResetLoses(derivedOnly, NODE), 'derived-only phrasing with no legibility → no confirmation')
  const customPhrasing = { ...derivedOnly, category_plural: 'artisanal gelato' }
  ok(categoryResetLoses(customPhrasing, NODE), 'a custom phrasing triggers the guard')
  ok(categoryResetLoses(fullTemplate(), NODE), 'legibility options trigger the guard')

  const change = categoryResetMessage('change')
  const clear = categoryResetMessage('clear')
  ok(change === 'Changing the category will reset category-specific wording and legibility options. Continue?', 'change copy', change)
  ok(clear === 'Clearing the category will reset category-specific wording and legibility options. Continue?', 'clear copy', clear)
  ok(!/pack size/i.test(change + clear), '§15 · copy does not claim pack size resets — it no longer does')
  ok(
    change.replace('Changing', 'X') === clear.replace('Clearing', 'X'),
    'both paths describe an identical loss, because it is identical'
  )
}

