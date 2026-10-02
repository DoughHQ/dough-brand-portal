# Dough brand portal — CONCEPT_SINGLE_TEST (implement against the golden fixtures)

You are implementing the **flagged** single concept test in **dough-brand-portal**. Read the code first. The fixtures in
`concept-core-fixtures/` (and their README) are the contract, not older chat plans. If code contradicts the fixtures, **stop and ask**.

## Non-negotiables

1. **Flag:** `CONCEPT_SINGLE_TEST_ENABLED` in `lib/studies/features.ts`, default `false`.
   - Flag **off**: editor, publish payload, preview, studies list and report behave **exactly as today**. Do not "quietly improve" flag-off paths.
   - Flag **on**: everything below.
2. **Four fixtures, four shapes (do not unify into one TypeScript type):**
   - `publish_args.json`: what `publish_study` must send
   - `journey.json`: `preview_concept_journey(p_field, p_module_config, p_battle_prompt)` → Section 2 journey outline, length meter, field warnings, review badge
   - `report_concept_test.json`: `get_concept_mission_report(mission_id).concept_test` → verdict page
   - `plan.json`: **app only**. Out of scope here.
   The preview RPC is `preview_concept_journey`, **not** `preview_concept_questionnaire`.
3. **Dark backend:** the pack may still be off. With the flag on and the pack off, publish/preview return `UNKNOWN_MODULE`. Ship against fixtures. Don't claim E2E until `CONCEPT_CORE_V1` is live in the same release train.
4. **First step:** regenerate `database.types.ts`. New RPCs: `preview_concept_journey`, `check_concept_decoy`, `approve_concept_mission`, `concept_verdict_dough_defaults`. Accept `lifecycle_state = 'in_review'` in the study types **even with the flag off** (the backend already returns it for held studies); render it gracefully everywhere.

## Publish contract (flag on) — see `publish_args.json`

- `p_test_type: 'concept'`, `p_modules: ['CONCEPT_CORE_V1']` only, `p_price_posture: 'blind'`, `p_target_completions >= 30`.
- **Send** `p_predictive_validity_opt_in` and `p_category_intelligence_opt_in` (today `lib/concept/publish.ts` drops them).
- `p_module_config`:
  - Text fields: `category_plural`, `pack_size` (required), `expected_price` (required), `price_display`.
  - Decoy: `decoy_option` and `verification_options` (≥2 real brands + decoy + none_of_these).
  - Battle prompt: `battle_prompt_code` **XOR** custom `p_battle_prompt`.
  - `brand_questions`: 0–2.
  - `success_bars`: see below.
- **Decoy:** generate the `{id:'decoy'}` option's label *from* `decoy_option`, so they can never differ (`DECOY_LABEL_MISMATCH` becomes impossible). Validate as the brand types with `check_concept_decoy(p_decoy)` → `{ok, reason, decoy}` (debounce ~400 ms). Prefill a made-up name.
- **Battle prompt:** vetted `CONCEPT_BATTLE_BUY | CONCEPT_BATTLE_LOOKS_BEST | CONCEPT_BATTLE_TRY | CONCEPT_BATTLE_EYE`, or custom 8–120 chars ending `?` with no links/emails/phones/handles. Choosing one clears the other.
- **success_bars:** one object; **each key** is absent (Dough default), `null` (bar off) or a value. Keys:
  - `h2h_min_win_share`: 0.50–0.90
  - `price_min_share_at_anchor`: 0.10–0.95
  - `liking_mode`: always send `off` for concept (no current pack). Absolute liking is out of scope until product asks for it.

  Model h2h/price as `default | off | {value}`. Defaults come from `concept_verdict_dough_defaults()`.

### Field model — equal concepts vs the competitive set
- Every design: `stimulus_type: "package"` and an **https `image_url`**. Server refuses otherwise (`CORE_REQUIRES_PACKAGE_STIMULUS`, `IMAGE_REQUIRED`).
- Every competitor product: an **https `frozen_image_url`**, otherwise `IMAGE_REQUIRED`. Require the image in the picker.
- **No current pack. No competitor to beat.** Every concept arm is equal (`battle_intent: "hero"`). Do **not** send `benchmark_role`. Competitors are equal seats in the field.
- Success is which design wins and whether it beats the competitive set — not “beats what we sell today.”

### Respondents never see the brand's labels
The server calls designs **"Design A", "Design B", …** to respondents (letter = position in `p_field.concepts`). The journey outline must use that letter, **never** brand display names. The brand's labels appear only in portal chrome and the report.

**CRITICAL (the one place this can go wrong while "following the JSON"):**
- `journey.json` `subject.display_name` / `arm_label` are **brand-facing only**. The phone-preview mapper turns concept index → "Design A/B/…" (same rule as the server) and **never** renders `display_name`/`arm_label` inside the mock phone. Unit-test the mapper: given `journey.json`, the mock contains "Design A" and "Design B" and never "New design" or "Current pack".
- **Reordering arms renames what respondents see.** In Section 1, show each design's letter beside it ("Respondents see: Design A") and update it live on reorder.
- If an image 404s in the preview, show an image placeholder plus the letter only. Never fall back to brand text.
- With the flag on, every design requires an https `image_url` and every product an https `frozen_image_url`. Validate client-side before publish.

## Section 2 (flag on) — journey cards, in `journey.json` order

1. **Screeners:**
   - Frequency is **Dough method / locked**.
   - Brands and decoy are **yours**; ≥2 brands are hard-required.
   - Show catalog labels as returned (brand typed "HALO TOP", respondents see "Halo Top").
2. **First look:** a locked 5-point rating per design.
3. **Battles:** prompt picker (4 vetted + write your own; custom → review badge).
4. **What matters:** locked MaxDiff (7 items, 7 sets).
5. **Rank the field:** locked.
6. **Price:** expected retail (yours); show the bands from the journey.
7. **Your questions:** 0–2 (→ review badge).
8. **Open text:** locked, optional.
9. **When do you win?:** head-to-head and price bars only (liking off — no current pack).

Every card says "Dough method" or "Yours", one line on what it measures, and which report section it fills.

- **Phone preview:** render `screens`, `counts`, `field_issues`, `needs_review`, `estimated_minutes` from `preview_concept_journey`.
- **Length meter:** use `counts.total_min`–`total_max`. Never invent a formula.
- **Show `field_issues` before publish:** `FIELD_TOO_SMALL`, `FIELD_TOO_LARGE`, `IMAGE_REQUIRED`. Legacy `BENCHMARK_*` codes should not appear once the server gate is lifted.

## Other UI (flag on)
- **Section 0:** Packaging only (remove the Price card and the coming-soon list); always blind.
- **Section 1:**
  - No current-pack or mark-to-beat controls. Every design and competitor is equal.
  - An image is required on every arm.
  - **Stop writing `draft.floor` on arm rename.**
- **Section 4 (modules):** hidden; never send `selectedModules`.
- **Section 5:** completions minimum **30**.
- **Permissions:**
  - Hide Publish unless `has_capability('missions.write')` (viewers can't publish).
  - Show an **Approve** button on held studies only to Dough admins; it calls `approve_concept_mission(mission_id)`.
- **After publish:** if the response has `awaiting_review: true` (`status: 'draft'`), show "In review: Dough is checking your wording" immediately.
- **Studies list:** `lifecycle_state === 'in_review'` gets that badge and appears on the **Active** tab.

## Report page (flag on) — `report_concept_test.json`
- **Lead with `verdict[]`** (new designs only). Show the estimate with `lo`–`hi`, the bar, `dough_default`, and `result`. Render `overall` from the server; never recompute.
- **Price:** one number when `share_conservative === share_generous`, otherwise the range.
- **Method text:** render `method` verbatim as footnotes. Never write "will succeed" or "predicts".
- **Then the sections:**
  - `first_look`
  - `what_matters` (including the "not enough answers yet" state)
  - `stated_vs_chosen`
  - `price[]`
  - `brand_questions` (labeled "Written by you")
  - `open_text`, with `scrub_note`, sortable by first-look rating
- `sample.n_completed: 0` with n=12 elsewhere is valid; don't treat it as empty.
- **Flag off:** keep `ConceptReportDeck` / `win_rate_field` untouched.

## Errors — extend `lib/concept/errors.ts` + field anchors (unknown hints must not dump on publish)
- **Permissions:** `NOT_ALLOWED_TO_PUBLISH` ("Your role can view studies but not publish them; ask a brand admin"), `CROSS_TENANT_ACCESS_DENIED`, `NOT_A_BRAND_PORTAL_USER`
- **Floors:** `TARGET_COMPLETIONS_TOO_LOW`, `CORE_REQUIRES_BLIND`, `PACK_SIZE_REQUIRED`, `ANCHOR_PRICE_REQUIRED`
- **Images:** `IMAGE_REQUIRED`, `CORE_REQUIRES_PACKAGE_STIMULUS`
- **Decoy:** `DECOY_REQUIRED`, `DECOY_IS_REAL_BRAND`, `DECOY_LABEL_MISMATCH`
- **Benchmark (retired):** `BENCHMARK_RETIRED` if any `benchmark_role` is sent. `DESIGN_REQUIRED` if there are zero designs.
- **Battle prompt:** `BATTLE_PROMPT_CONFLICT`, `UNKNOWN_BATTLE_PROMPT`, `INVALID_BATTLE_PROMPT`
- **Brand questions:** `TOO_MANY_BRAND_QUESTIONS`, `BRAND_QUESTION_OPTION_COUNT`, `DUPLICATE_BRAND_QUESTION_OPTION`, `INVALID_BRAND_QUESTION_PROMPT`, `INVALID_BRAND_QUESTION_OPTION`, `INVALID_BRAND_QUESTION_MAX_SELECT`
- **Bars:** `H2H_BAR_OUT_OF_RANGE`, `PRICE_BAR_OUT_OF_RANGE`, `LIKING_MODE_RETIRED`, `LIKING_BAR_OUT_OF_RANGE`, `INVALID_SUCCESS_BARS` (portal always sends `liking_mode: off`)
- **Other:** `CONCEPT_CORE_EXCLUSIVE`, `UNKNOWN_MODULE`, `INVALID_TEMPLATE_VALUE`, `TOO_FEW_ENTITY_OPTIONS`

## Dead code — list in the PR, do not delete (see DEAD_CODE.md)
PriceQuestionnaireEditor, LegacyQuestionsBuilder, PackagingQuestionnaireEditor, PRICE_POSTURE_OPTIONS/pricePostureHelp (still used flag-off),
draft floor/diagnostics/screeners/session2IntervalHours writes. Cleanup is a post-launch PR after price mode is retired.

## Acceptance
- [ ] Flag off: identical to today.
- [ ] Flag on: the logged payload for the fixture draft deep-equals `publish_args.json` (plus opt-ins).
- [ ] The journey outline renders `journey.json` stages with "Design A/B", never the brand's labels. The meter shows 20–23 screens (~3.5 min). Review badge present.
- [ ] Every error code surfaces on the right field.
- [ ] The verdict page renders `report_concept_test.json`, including `too_close_to_call`, the cleared liking bar, the single price number, the scrubbed verbatim, and method footnotes.
- [ ] Studies list shows `in_review` on Active; viewers see no Publish; only admins see Approve.

## Out of scope
App ConceptRunner (separate PR; `plan.json` requires it before the flag flips in production). Deleting dead code. Audience builder (`STUDY_AUDIENCE_BUILDER_ENABLED` stays false).

## Report back
Files changed, one real logged payload, screenshots of Section 2 (journey outline) and the verdict page.
