# Dead code — list only (do not delete while flag-off / price mode live)

Flag-on single-test leaves these paths unused for packaging CORE studies. Keep them for flag-off Packaging + Price until a cleanup PR after price mode is retired.

- `PriceQuestionnaireEditor`
- `LegacyQuestionsBuilder` (in `QuestionsSection.tsx`)
- `PackagingQuestionnaireEditor` (questionnaire when flag off)
- Questionnaire walkthrough (`/preview` → `previewConceptQuestionnaireAction`) — still the Preview dock today; journey outline is Section 2 when flag on
- `PRICE_POSTURE_OPTIONS` / `pricePostureHelp` (still used flag-off)
- Draft writes: `floor`, diagnostics, screeners, `session2IntervalHours` (single-test stops rewriting floor on arm rename; flag-off still may write floor)
- `ModulesSection` when `CONCEPT_SINGLE_TEST_ENABLED` (hidden, not deleted)
- Study-type Price card when flag on (hidden, not deleted)

Removed elsewhere (true orphans): `previewPackagingQuestionsAction`, deprecated `publishConceptMissionAction`, `rpcBuildConceptQuestionsFromTemplate`.
