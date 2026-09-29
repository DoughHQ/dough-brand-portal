# Single concept test — golden fixtures (v2)

Generated 2026-09-29 from the **committed production functions**, inside transactions that were rolled back.
Nothing here exists in the database; every UUID is fixture-only. Regenerate from the database; never hand-edit.

| File | Produced by | Use it for |
|---|---|---|
| `publish_args.json` | the input | Portal: the exact `publish_study` arguments for this draft. The portal omits `p_created_by` (the server uses the signed-in user) and must also send `p_predictive_validity_opt_in` and `p_category_intelligence_opt_in`. |
| `journey.json` | `preview_concept_journey(p_field, p_module_config, null)` | Portal: Section 2 journey outline, length meter, field warnings, review badge |
| `plan.json` | `start_concept_session(claim, 1)` → `plan` (a respondent, before answering) | App: the runner, screen by screen |
| `report_concept_test.json` | `get_concept_mission_report(mission_id)` → `concept_test`, after 12 scripted respondents | Portal: the verdict page and report sections |

v2 changes: designs are `stimulus_type: "package"` with https images (the server now requires both), and respondents see neutral design names.
v2.1: price questions no longer carry internal keys (server fix); nothing for the app or portal to change.
The report fixture comes from the same scripted answers; none of its fields depend on stimulus type or images.

## Rules the server now enforces (single test only)
- Every design is `stimulus_type: "package"`, otherwise `CORE_REQUIRES_PACKAGE_STIMULUS`.
- Every design has an `https://` `image_url`, and every competitor product has an `https://` `frozen_image_url`, otherwise `IMAGE_REQUIRED`.
- **Respondents never see a brand's own labels.** The plan and session summary call the brand's designs **"Design A", "Design B", …** (letter = position in `p_field.concepts`). Competitor products keep their real names. The brand's report keeps the brand's real labels ("New design", "Current pack").

## Journey (portal)
- Option lists equal what publish stores, byte for byte (proven). Brand options show the catalog display name: the brand typed "HALO TOP", respondents see "Halo Top".
- `subject.display_name` / `arm_label` are the **brand's** labels, for the brand's orientation. The journey outline must show what respondents see: Design A/B… (never brand arm labels).
- `field_issues` codes: `FIELD_TOO_SMALL`, `FIELD_TOO_LARGE`, `BENCHMARK_REQUIRED`, `TOO_MANY_BENCHMARKS`, `NOTHING_TO_TEST`.
- `needs_review: true` means a custom battle prompt or brand question is present, so the study is held until Dough approves it.
- Per-design screens (rating, price) rotate per respondent. Invalid brand text raises the same errors publish does.

## Plan (app)
- `answerable` is `null` on "why" follow-ups until their battle is answered. Treat `null` as `false`.
- Rotation and shuffles are server-side. This respondent saw Design A's price first, and the rank's `shown_order` was [1, 3, 2]. Never reorder.
- Rank: show `items` in `shown_order` exactly; submit via `record_stated_ranking`. It is write-once.
- The summary has `allow_reorder: false`: results only.
- Price question configs carry only display fields (`prompt`, `options`, `band_basis`, …). The server stopped shipping its internal keys on 2026-09-29.

## Report (portal)
- `verdict[].*.result` ∈ `cleared | not_cleared | too_close_to_call | not_enough_responses | not_tested`. Render `overall` from the server; never recompute.
- Always show the interval (`lo`–`hi`) with the estimate, and the bar beside Dough's default.
- Price: with anchor-edge bands, `share_conservative` equals `share_generous`. Show one number when they're equal, and the range when they differ.
- `sample.n_completed` is 0 here only because scripted sessions weren't completed. `what_matters` shows the "not enough answers yet" state (it scores from 15 respondents).
- Render `method` text verbatim. Never add "will succeed" or "predicts".

## Other contracts
- `check_concept_decoy(p_decoy)` → `{ok, reason, decoy}`. Reasons: `EMPTY`, `TOO_LONG`, `REAL_BRAND`, or a text-check reason such as `PHONE_NUMBER`. Treat any reason as not ok.
- The study lists (`list_operator_studies`, `list_operator_studies_page`) return `lifecycle_state = 'in_review'` for held studies. They are listed without `p_include_drafts`, and appear in the Active tab. The raw `status` stays `draft`.
- `approve_concept_mission(p_mission_id)` is Dough-admin only and releases a held study.
