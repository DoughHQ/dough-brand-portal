# Dead code — list only (do not delete in this PR)

Flag-on single-test leaves these paths unused for packaging CORE studies. Keep them for flag-off / price mode until a cleanup PR.

- `PriceQuestionnaireEditor`
- `LegacyQuestionsBuilder` (if present)
- `previewPackagingQuestionsAction` / questionnaire preview path for packaging when journey is the preview
- `PRICE_POSTURE_OPTIONS` / `pricePostureHelp` (still used flag-off)
- Draft writes: `floor`, diagnostics, screeners, `session2IntervalHours` (single-test stops rewriting floor on arm rename; flag-off still may write floor)
- `ModulesSection` when `CONCEPT_SINGLE_TEST_ENABLED` (hidden, not deleted)
- Study-type Price card when flag on (hidden, not deleted)

Cleanup is a post-launch PR after flag-off price mode is retired or moved.
