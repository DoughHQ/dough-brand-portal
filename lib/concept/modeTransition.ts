/**
 * Section 0 state transitions.
 *
 * `selectMode` used to be treated as "change one enum". It is not — it is a
 * destructive state transition that touches the arms, the products, the price
 * posture and the entire template config. This module makes every mutation
 * explicit, and makes the destructive ones ask first.
 *
 * ---------------------------------------------------------------------------
 * TEMPLATE FIELD CLASSIFICATION  (Packaging <-> Price)
 * ---------------------------------------------------------------------------
 *
 * SHARED — semantically valid in both modes, never reset by a mode change:
 *   category_plural      respondent copy in both templates; derived from the
 *                        taxonomy category, which a mode switch does not touch.
 *   price_display        formatted form of expected_price; recomputed at compose
 *                        time from the same anchor. Valid wherever the anchor is.
 *   decoy_option         attention-check decoy brand. Validated in both modes
 *                        whenever a verification screener exists.
 *   verification_options attention-check real brands. Validated in both modes.
 *   expected_price       ANCHOR_PRICE_REQUIRED has no mode guard — required by
 *                        BOTH package and price. Resetting it on a mode switch
 *                        was destroying a value the destination mode demands.
 *   price_answer_mode    constant 'bands' today; carries no mode meaning.
 *
 * MODE-SPECIFIC BUT DORMANT — only surfaced/validated in one mode, but still
 * true in the other. Retained in draft state so switching back restores work.
 * Validation already scopes both to package, so carrying them costs nothing:
 *   pack_size            validateConceptTemplateConfig only checks it when
 *                        mode === 'package'. It describes the product, not the
 *                        methodology, so it stays true while Price is active.
 *   legibility_options   same mode guard. Derived from taxonomy siblings of the
 *                        selected category — and the category survives the
 *                        switch, so the derivation is still correct.
 *
 * INCOMPATIBLE — none.
 *   No member of PackagingTemplateConfig becomes wrong when the study type
 *   changes. Every field describes the product or the category; none describes
 *   the methodology. That is why the wholesale reset was pure data loss and is
 *   removed rather than narrowed.
 *
 * What IS genuinely incompatible on entering a blind-image mode lives outside
 * templateConfig, and is preserved as behaviour:
 *   pricePosture -> 'blind'      both publishable modes force blind pricing
 *   arm/product frozen_price -> null   prices cannot be shown in a blind test
 */

import type {
  ConceptArmRow,
  ConceptStudyDraft,
  PackagingTemplateConfig,
  StimulusMode,
} from './types'
import { categoryPluralFromNodeName } from './taxonomySiblings'
import { editableLegibilityOptions } from './templateConfig'

/** The two modes that force blind pricing and the template questionnaire. */
export function isBlindImageMode(mode: StimulusMode | null): mode is 'package' | 'price' {
  return mode === 'package' || mode === 'price'
}

/** Price is a single-product test; packaging supports variants. */
export function maxArmsForMode(mode: StimulusMode | null): number {
  return mode === 'price' ? 1 : Infinity
}

/**
 * An arm the operator has actually worked on. Anything with a name, an image or
 * a price is work; a row with none of those is an untouched seed.
 */
export function isConfiguredArm(arm: ConceptArmRow): boolean {
  return (
    !!arm.display_name.trim() ||
    !!arm.image_url?.trim() ||
    !!arm.frozen_price?.trim()
  )
}

/**
 * LEGACY NORMALIZATION ONLY.
 *
 * Fresh drafts arrive with zero arms as of Pass 3, so this is a no-op for them.
 * It remains because drafts stored before that change can still carry two blank
 * seed rows, and choosing a study type should not leave their owner owing two
 * product names they never asked for.
 *
 * Deliberately conservative: if ANY arm is configured, nothing is touched. This
 * never removes work, and never removes an in-progress row the operator just
 * added next to a finished one.
 */
export function normalizeSeededArms(arms: ConceptArmRow[]): ConceptArmRow[] {
  if (arms.length <= 1) return arms
  if (arms.some(isConfiguredArm)) return arms
  return arms.slice(0, 1)
}

/** Configured variants that a switch to `mode` would destroy. */
export function armsLostByModeSwitch(
  arms: ConceptArmRow[],
  mode: StimulusMode
): ConceptArmRow[] {
  const max = maxArmsForMode(mode)
  if (!Number.isFinite(max) || arms.length <= max) return []
  return arms.slice(max).filter(isConfiguredArm)
}

/**
 * Copy for the destructive-mode-switch guard. Counts are real, never rounded and
 * never plural-by-default. Pass 3 splits it into dialog parts: the title asks,
 * the body names the consequence, the action names itself.
 */
export function modeSwitchLossMessage(lostCount: number, mode: StimulusMode): string {
  const noun = lostCount === 1 ? '1 configured variant' : `${lostCount} configured variants`
  return `Price studies use one product. Switching will keep one product and remove ${noun}.`
}

export function modeSwitchConfirmTitle(mode: StimulusMode): string {
  return `Switch to ${mode === 'price' ? 'Price' : 'Packaging'}?`
}

export function modeSwitchConfirmLabel(mode: StimulusMode): string {
  return `Switch to ${mode === 'price' ? 'Price' : 'Packaging'}`
}

export type ModeTransition =
  | { kind: 'noop' }
  | { kind: 'apply'; next: ConceptStudyDraft }
  | { kind: 'confirm'; message: string; next: ConceptStudyDraft }

/**
 * The whole transition, as one pure function. Callers apply `next` only after
 * any confirmation resolves — nothing is mutated before the operator answers.
 */
export function planModeTransition(
  draft: ConceptStudyDraft,
  mode: StimulusMode,
  publishable: boolean
): ModeTransition {
  if (!publishable) return { kind: 'noop' }
  if (draft.stimulusMode === mode) return { kind: 'noop' }

  const normalized = normalizeSeededArms(draft.conceptArms)
  const lost = armsLostByModeSwitch(normalized, mode)
  const max = maxArmsForMode(mode)
  const kept = Number.isFinite(max) ? normalized.slice(0, max) : normalized

  const entering = isBlindImageMode(mode)

  const next: ConceptStudyDraft = {
    ...draft,
    stimulusMode: mode,
    sessionCount: 1,
    conceptArms: entering
      ? kept.map((a) => ({ ...a, frozen_price: null }))
      : kept,
    products: entering
      ? draft.products.map((p) => ({ ...p, frozen_price: null }))
      : draft.products,
    ...(entering ? { pricePosture: 'blind' as const } : null),
    // templateConfig is carried through untouched. See the classification above:
    // no member of it is incompatible with either publishable mode.
    templateConfig: draft.templateConfig,
  }

  if (lost.length > 0) {
    return { kind: 'confirm', message: modeSwitchLossMessage(lost.length, mode), next }
  }
  return { kind: 'apply', next }
}

/* -------------------------------------------------------------------------- */
/* Category-derived state                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fields that are derived from the selected taxonomy category, and are the only
 * things a category change or clear may reset.
 */
export const CATEGORY_DERIVED_FIELDS = ['category_plural', 'legibility_options'] as const

/**
 * Does a category reset actually destroy anything? Used to decide whether to ask
 * at all — a confirmation for a no-op trains operators to click through.
 *
 * Same two conditions the change path already used, lifted out so the clear path
 * can share them:
 *   - phrasing the operator customised (non-empty AND different from what the
 *     currently selected node derives)
 *   - any real legibility option
 *
 * `currentNodeNameDisplay` is the node selected *now*, not the one being moved
 * to: the question is what the operator would lose, measured against what they
 * have.
 */
export function categoryResetLoses(
  config: PackagingTemplateConfig,
  currentNodeNameDisplay: string | null | undefined
): boolean {
  const phrasing = config.category_plural.trim()
  const derived = currentNodeNameDisplay
    ? categoryPluralFromNodeName(currentNodeNameDisplay)
    : ''
  const phrasingCustomised = !!phrasing && phrasing !== derived
  const hasLegibility = editableLegibilityOptions(config).length > 0
  return phrasingCustomised || hasLegibility
}

/**
 * One body sentence, used by BOTH the change path and the clear path, because
 * the loss is identical. It names only what actually resets — Pass 1 stopped
 * pack size, expected price and verification from being touched, so they are
 * deliberately absent here.
 */
export const CATEGORY_RESET_BODY =
  'This will reset category-specific questionnaire wording and legibility options.'

export function categoryResetTitle(action: 'change' | 'clear'): string {
  return action === 'change' ? 'Change category?' : 'Clear category?'
}

export function categoryResetConfirmLabel(action: 'change' | 'clear'): string {
  return action === 'change' ? 'Change category' : 'Clear category'
}

/** @deprecated Pass 3 replaced the native confirm with a dialog. Kept for the
 *  domain tests that assert both paths describe an identical loss. */
export function categoryResetMessage(action: 'change' | 'clear'): string {
  const verb = action === 'change' ? 'Changing' : 'Clearing'
  return `${verb} the category will reset category-specific wording and legibility options. Continue?`
}

/**
 * Derive `category_plural` when, and only when, it is empty.
 *
 * The data model has no flag distinguishing "operator typed this" from "we
 * derived it", and this pass does not add a persistence field for it (§32). So
 * the rule is the conservative one: a non-empty value is treated as the
 * operator's and never overwritten; an empty value is re-derived from the
 * selected node. That makes derivation automatic and deterministic without
 * ever clobbering a custom phrasing.
 */
export function withDerivedCategoryPlural(
  config: PackagingTemplateConfig,
  nodeNameDisplay: string | null | undefined
): PackagingTemplateConfig {
  if (config.category_plural.trim()) return config
  if (!nodeNameDisplay?.trim()) return config
  return { ...config, category_plural: categoryPluralFromNodeName(nodeNameDisplay) }
}

/**
 * Is this phrasing simply what the taxonomy node derives?
 *
 * Pass 1 established that the data model carries no custom/derived flag and that
 * this pass does not add one. Equality with the derived value is therefore the
 * definition of "default": the operator sees an override treatment only when the
 * value genuinely differs from what Dough would have produced on its own.
 */
export function isDerivedCategoryPlural(
  value: string,
  nodeNameDisplay: string | null | undefined
): boolean {
  const v = value.trim()
  if (!v) return true
  if (!nodeNameDisplay?.trim()) return true
  return v === categoryPluralFromNodeName(nodeNameDisplay)
}

/**
 * Rehydrate category-derived state once the taxonomy node resolves. Returns the
 * same object identity when nothing changes, so callers can skip the write.
 */
export function rehydrateCategoryDerived(
  draft: ConceptStudyDraft,
  nodeNameDisplay: string | null | undefined
): ConceptStudyDraft {
  if (draft.taxonomyNodeId == null) return draft
  const config = withDerivedCategoryPlural(draft.templateConfig, nodeNameDisplay)
  if (config === draft.templateConfig) return draft
  return { ...draft, templateConfig: config }
}
