# DRY Refactor Plan - 2026-06-18

## Goal

Refactor old backend code to follow the new `.agent/guide.md` rule: before writing SQL, mapper, or business logic, reuse existing `services/`, `utilities/`, and `model/` code, or extract shared helpers instead of repeating logic.

The refactor must preserve existing API response shapes, route behavior, database schema, and transaction boundaries.

## Current Status

- Status: completed
- Owner: agent
- Created: 2026-06-18
- Phase 0 baseline completed successfully on 2026-06-18.
- Phase 1 revised on 2026-06-18 after user feedback: use Facade class calls such as `User.findById(...)` and `Department.getById(...)`, not direct function imports or SQL fragment/mapper helpers.
- Phase 2 revised on 2026-06-18 after user feedback: extracted query helpers under `utilities/query`, refactored dashboard services, refactored `getAll` services so they query ids and call domain Facade methods such as `Site.getById(...)`, `Candidate.getById(...)`, and `Job.getById(...)`, and kept Facade classes in the concise static-assignment style.
- Phase 3 completed on 2026-06-18: extracted entity lookup/resolution helpers under `utilities/entity`, refactored candidate/job batch import, and refactored file parsers to share lookup-map and placeholder resolution logic.
- Phase 4 completed on 2026-06-18: extracted file row string/date helpers under `utilities/file` and refactored parser services to use them.
- Phase 5 completed on 2026-06-18: extracted small DB linking helpers under `utilities/db` and refactored candidate/job link insert/replace flows while keeping entity validation in domain Facade services.
- Phase 6 completed on 2026-06-18: extracted small CRUD DB helpers under `utilities/db`, refactored basic CRUD create/update/delete/getById flows, and preserved concise static Facade classes with direct same-domain imports only where needed to avoid circular runtime imports.
- Final verification completed on 2026-06-18: full typecheck and full test suite passed.
- Existing documentation changes: `.agent/guide.md` now contains DRY rules; `.github/instructions/agent-workflow.instructions.md` now requires future plans to be stored in `.agent/`.

## Scope

Primary scope:
- `services/user/`
- `services/department/`
- `services/company/`
- `services/level/`
- `services/platform/`
- `services/segment/`
- `services/site/`
- `services/candidate/`
- `services/job/`
- `services/dashboard/`
- `services/file/`
- `utilities/`
- `model/`
- Matching tests under `test/`

Out of scope unless required by tests:
- Route contract changes
- Database schema changes
- Large controller rewrites
- New features unrelated to deduplication

## Refactor Rules

- Keep API outputs compatible with current tests and controllers.
- Prefer small helpers over broad abstract factories until behavior is well covered by tests.
- Use existing alias imports such as `@services/*`, `@model/*`, `@utilities/*`.
- Do not move ownership across domains blindly: domain-owned behavior must be called through that domain's Facade class; generic query utilities belong in `utilities/` only when no existing domain service owns the behavior.
- In service/controller code, prefer class facade imports such as `User.findById(...)`, `Department.getById(...)`, `Level.getById(...)`. Avoid direct imports like `import findById from "@services/user/findById"` outside facade implementation files.
- When a helper is created under `utilities/`, add a mirrored test under `test/utilities/`.
- When a service behavior changes internally, run the most specific matching service tests.

## Phase 0 - Baseline

- [x] Run `npm run check` before source refactor.
- [x] Run focused existing suites before broad edits:
  - [x] `npm run test:file 'test/services/user/*.test.ts'` - 29 passing
  - [x] `npm run test:file 'test/services/candidate/*.test.ts'` - 38 passing; pre-existing `pg` deprecation warning about concurrent `client.query()`
  - [x] `npm run test:file 'test/services/job/*.test.ts'` - 12 passing; pre-existing `pg` deprecation warning about concurrent `client.query()`
  - [x] `npm run test:file 'test/services/dashboard/*.test.ts'` - 43 passing
  - [x] `npm run test:file 'test/services/file/*.test.ts'` - 30 passing; pre-existing `pg` deprecation warning about concurrent `client.query()`
- [x] Record any pre-existing failures in this plan before editing source. No baseline failures found.

## Phase 1 - Facade-Based Domain Reuse For Public User And Relations

Problem:
- Public user columns and user row mapping are repeated in many services.
- This is both a DRY issue and a sensitive-data risk.
- The first implementation extracted `userPublicMapper`, but the user rejected that direction because callsites should show domain ownership through class methods such as `User.findById(...)`.

Known affected files:
- `services/user/getAll.ts`
- `services/user/findById.ts`
- `services/user/create.ts`
- `services/user/createHR.ts`
- `services/user/updateProfile.ts`
- `services/user/findByAccount.ts`
- `services/department/getAll.ts`
- `services/department/getById.ts`
- `services/department/create.ts`
- `services/department/update.ts`
- `services/candidate/populate.ts`
- `services/job/populate.ts`
- `services/job/create.ts`
- `services/file/parseCandidateSheet.ts`
- `services/file/parseJobSheet.ts`

Plan:
- [x] Remove the `userPublicMapper` direction from source changes.
- [x] Keep `services/user/_User.ts` as a concise static Facade. Same-domain user services use direct same-domain imports where importing `_User.ts` would create a circular runtime dependency.
- [x] Refactor `services/user/getAll.ts`, `services/user/create.ts`, `services/user/createHR.ts`, and `services/user/updateProfile.ts` to call `User.findById(...)` instead of importing `findById` directly.
- [x] Refactor department services to fetch department rows first, then call `User.findById(...)` for optional `user_id`.
- [x] Refactor candidate/file parser code to call `User.findById(...)` or `User.getAll(...)` instead of duplicating public user SQL/mapping.
- [x] Refactor job relation code to call Facade classes (`Department.getById(...)`, `Segment.getById(...)`, `Site.getById(...)`, `Level.getById(...)`, `User.findById(...)`) instead of user SQL fragments/mappers.
- [x] Special case `findByAccount`: replaced `SELECT *` with explicit auth-only columns and explicit mapping to `userModel`, because this function needs account/password internally.
- [x] Verify no direct `findById`/`getById` service-function imports remain in business service code outside Facade class implementation.

Verification:
- [x] `npm run check` - passing
- [x] `npm run test:file 'test/services/user/*.test.ts'` - 29 passing; `pg` deprecation warning surfaced in `getAll` path
- [x] `npm run test:file 'test/services/candidate/populate.test.ts' 'test/services/file/parseCandidateSheet.test.ts' 'test/services/file/parseJobSheet.test.ts'` - 15 passing; pre-existing `pg` deprecation warning in parser path
- [x] `npm run test:file 'test/services/job/*.test.ts' 'test/controller/department/departmentController.test.ts'` - 18 passing; pre-existing `pg` deprecation warning in job update path
- [x] `grep` check for direct `findById`/`getById` imports and removed mapper remnants - no matches in `services/**/*.ts`

## Phase 2 - Query Builders For Pagination, WHERE Clauses, And Dashboard Charts

Problem:
- Pagination/count/search logic repeats across CRUD `getAll` services.
- Dashboard date range and filter `WHERE` building repeats across chart services.
- Chart row mapping repeats in most dashboard services.

Known affected files:
- `services/company/getAll.ts`
- `services/department/getAll.ts`
- `services/level/getAll.ts`
- `services/platform/getAll.ts`
- `services/segment/getAll.ts`
- `services/site/getAll.ts`
- `services/user/getAll.ts`
- `services/candidate/getAll.ts`
- `services/job/getAll.ts`
- `services/dashboard/hcRequestedByDepartment.ts`
- `services/dashboard/hcRequestedByMonth.ts`
- `services/dashboard/hcByRecruiter.ts`
- `services/dashboard/hcRequestedByHiringManager.ts`
- `services/dashboard/hcRequestedByHrbp.ts`
- `services/dashboard/candidatesByDepartment.ts`
- `services/dashboard/candidatesByPlatform.ts`
- `services/dashboard/recruitmentFunnel.ts`
- `services/dashboard/jobHCTracking.ts`

Plan:
- [x] Create `utilities/query/buildWhereClause.ts` for joining conditions safely.
- [x] Create `utilities/query/buildDateRangeConditions.ts` for date range filters with parameter indexing handled by params length.
- [x] Create `utilities/query/buildPagination.ts` for default page/limit/offset/unlimited handling.
- [x] Create `utilities/query/mapChartRows.ts` for `ChartDataPoint[]` mapping.
- [x] Refactor dashboard services first because dashboard tests already exist.
- [x] Refactor CRUD `getAll` services after dashboard helpers are stable.
- [x] Keep CRUD/Candidate/Job/User Facade classes concise with normal imports and static assignments; avoid `typeof import(...)` and dynamic `await import(...)` facades.
- [x] Refactor `company`, `level`, `platform`, `segment`, `site`, `department`, `candidate`, and `job` `getAll` services to query ids first, then call their domain Facade `getById` methods for result objects.

Verification:
- [x] Add tests for new query utilities under `test/utilities/query/` - `npm run test:file 'test/utilities/query/*.test.ts'` passed, 15 passing.
- [x] `npm run test:file 'test/services/dashboard/*.test.ts'` - 43 passing.
- [x] Added service tests for `company`, `level`, `platform`, `segment`, `site`, `department`, and `job` `getAll`; extended candidate `getAll` pagination coverage.
- [x] `npm run test:file 'test/services/company/getAll.test.ts' 'test/services/level/getAll.test.ts' 'test/services/platform/getAll.test.ts' 'test/services/segment/getAll.test.ts' 'test/services/site/getAll.test.ts' 'test/services/department/getAll.test.ts' 'test/services/user/getAll.test.ts'` - 26 passing; pre-existing `pg` deprecation warning in user getAll path.
- [x] `npm run test:file 'test/services/candidate/getAll.test.ts' 'test/services/job/getAll.test.ts'` - 7 passing; pre-existing `pg` deprecation warning in candidate getAll path.
- [x] `npm run test:file 'test/controller/company/companyController.test.ts' 'test/controller/level/levelController.test.ts' 'test/controller/platform/platformController.test.ts' 'test/controller/segment/segmentController.test.ts' 'test/controller/site/siteController.test.ts' 'test/controller/department/departmentController.test.ts'` - 36 passing.
- [x] `npm run test:file 'test/controller/candidate/candidateController.test.ts' 'test/controller/job/jobController.test.ts'` - 14 passing; expected validation-error logs in negative controller tests.
- [x] `grep` check for old pagination/WHERE ternary patterns in `services/**` - no matches.
- [x] `grep` check for `getAll` result construction through domain Facade `getById` - confirmed `Company.getById`, `Level.getById`, `Platform.getById`, `Segment.getById`, `Site.getById`, `Department.getById`, `Candidate.getById`, and `Job.getById` in their `getAll` services.
- [x] `grep` check for `typeof import(...)` and dynamic `await import(...)` in Facade files - no matches after reverting Facades to concise static assignments.
- [x] `npm run check` - passing.

## Phase 3 - Entity Resolution And Lookup Maps

Problem:
- `resolveAndCreateEntities` is duplicated in candidate and job batch imports.
- Parser services build case-insensitive maps manually.

Known affected files:
- `services/candidate/batchImport.ts`
- `services/job/batchImport.ts`
- `services/file/parseCandidateSheet.ts`
- `services/file/parseJobSheet.ts`

Plan:
- [x] Create `utilities/entity/normalizeLookupKey.ts`.
- [x] Create `utilities/entity/buildEntityMap.ts`.
- [x] Create `utilities/entity/resolveEntity.ts` for lookup with optional placeholder creation.
- [x] Create `utilities/entity/resolveAndCreateEntities.ts` for batch import use.
- [x] Refactor candidate and job batch import to use the shared resolver.
- [x] Refactor file parsers to use shared entity map and relation resolution helpers.

Safety notes:
- Keep table and column names as code-owned config, not user-controlled input.
- Preserve current case-insensitive behavior and original casing when creating missing entities.

Verification:
- [x] Add tests for `utilities/entity/*` - `npm run test:file 'test/utilities/entity/*.test.ts'` covered normalize, build map, resolve single/multiple entities, and DB-backed resolve/create behavior.
- [x] Add `test/services/job/batchImport.test.ts` because Phase 3 modified `services/job/batchImport.ts`.
- [x] `npm run test:file 'test/utilities/entity/*.test.ts' 'test/services/candidate/batchImport.test.ts' 'test/services/job/batchImport.test.ts' 'test/services/file/parseCandidateSheet.test.ts' 'test/services/file/parseJobSheet.test.ts' 'test/services/job/createWithAll.test.ts' 'test/services/job/updateWithAll.test.ts'` - 41 passing; pre-existing `pg` deprecation warning in candidate batch import path.
- [x] `npm run check` - passing.
- [x] `grep` check for local `resolveAndCreateEntities`, manual entity maps, local `resolveRelationWithPlaceholder`, and repeated `trim().toLowerCase()` in Phase 3 target files - target files clean. Remaining match is `services/candidate/createWithAll.ts`, which is outside the current Phase 3 affected-file list.

## Phase 4 - File Parser Field Helpers

Problem:
- `parseCandidateSheet` and `parseJobSheet` repeat `String(row[header]).trim()` and date parsing logic.
- Existing `utilities/file/*` helpers cover worksheet/cell extraction, but not service-level row field normalization.

Known affected files:
- `services/file/parseCandidateSheet.ts`
- `services/file/parseJobSheet.ts`
- Existing helper area: `utilities/file/`

Plan:
- [x] Add `utilities/file/getRowString.ts` or `utilities/file/parseRowField.ts`.
- [x] Add `utilities/file/getRowDate.ts`.
- [x] Add optional batch field mapper only if it reduces real repetition without hiding meaning. Skipped; explicit field-by-field calls stayed clearer.
- [x] Refactor parser services to use these helpers.

Verification:
- [x] Add tests under `test/utilities/file/` for whitespace, null, undefined, empty strings, dates, and numeric-looking strings.
- [x] `npm run test:file 'test/utilities/file/getRowString.test.ts' 'test/utilities/file/getRowDate.test.ts'` - 11 passing.
- [x] `npm run test:file 'test/services/file/parseCandidateSheet.test.ts' 'test/services/file/parseJobSheet.test.ts'` - 11 passing; pre-existing `pg` deprecation warning in parser path.
- [x] `npm run check` - passing.
- [x] `grep` check for repeated `String(row[...]).trim()` and `new Date(row[...])` patterns in `services/file/parse*Sheet.ts` - no matches.

## Phase 5 - Linking Helpers For Many-To-Many Tables

Problem:
- Candidate and job create/update repeat delete/insert/validate patterns for linking tables.

Known affected files:
- `services/candidate/create.ts`
- `services/candidate/update.ts`
- `services/job/create.ts`
- `services/job/update.ts`

Plan:
- [x] Create a small helper such as `utilities/db/linking.ts`.
- [x] Add `assertExistingIds` for FK validation. Skipped intentionally: FK/domain validation stays in Facade calls like `Department.getById(...)`, `Level.getById(...)`, and `User.findById(...)` to keep domain ownership visible.
- [x] Add `insertLinks` for simple two-column links. Implemented as `insertLinkRows(...)`, which also supports explicit extra link columns such as `candidate_required`.
- [x] Add `replaceLinks` for update paths that delete old rows then insert new rows. Implemented as `replaceLinkRows(...)`.
- [x] Keep special columns such as `candidate_required` explicit and readable.
- [x] Refactor candidate levels first because it is simpler.
- [x] Refactor job relations after helper behavior is covered.

Verification:
- [x] Add tests for linking utilities using real DB transactions where needed - `test/utilities/db/linking.test.ts`.
- [x] `npm run test:file 'test/utilities/db/linking.test.ts'` - 5 passing.
- [x] `npm run test:file 'test/services/candidate/create.test.ts' 'test/services/candidate/update.test.ts'` - 4 passing; pre-existing `pg` deprecation warning in candidate create path.
- [x] `npm run test:file 'test/services/job/createWithAll.test.ts' 'test/services/job/updateWithAll.test.ts'` - 12 passing; pre-existing `pg` deprecation warning in job update path.
- [x] `npm run test:file 'test/controller/candidate/candidateController.test.ts' 'test/controller/job/jobController.test.ts'` - 14 passing; expected validation-error logs in negative controller tests.
- [x] `npm run check` - passing.
- [x] `grep` check for raw link table `INSERT`/`DELETE` SQL in Phase 5 service targets - source targets clean; remaining match is test seed SQL in `test/services/candidate/populate.test.ts`.

## Phase 6 - Small CRUD Helpers After Coverage Exists

Problem:
- Basic CRUD services repeat getById, delete-by-ids, create, dynamic update, count, and mapping logic.
- Some CRUD domains appear to lack complete service tests, so broad factory extraction is risky.

Known affected domains:
- `company`
- `level`
- `platform`
- `segment`
- `site`
- `department`
- `user`

Plan:
- [x] Add missing service tests before broad CRUD refactor. Existing controller/service coverage was used for CRUD behavior, and new utility tests were added for extracted DB helpers.
- [x] Extract tiny helpers first: `assertRowFound`, `buildUpdateSet`, `deleteByIds`. Implemented as `assertFirstRow`, `buildUpdateSet`, and `deleteByIds`.
- [x] Avoid large generic factories until tests prove the local variations are understood.
- [x] Refactor one domain at a time and run its mirrored tests immediately.

Verification:
- [x] Added utility tests for `assertFirstRow`, `buildUpdateSet`, `deleteByIds`, and shared `quoteIdentifier` under `test/utilities/db/`.
- [x] `npm run test:file 'test/utilities/db/*.test.ts'` - 14 passing.
- [x] `npm run test:file 'test/controller/company/companyController.test.ts' 'test/controller/level/levelController.test.ts' 'test/controller/platform/platformController.test.ts' 'test/controller/segment/segmentController.test.ts' 'test/controller/site/siteController.test.ts' 'test/controller/department/departmentController.test.ts' 'test/controller/user/createUserController.test.ts' 'test/controller/user/createHRController.test.ts' 'test/controller/user/updateUserController.test.ts' 'test/controller/user/deleteUserController.test.ts' 'test/controller/user/getUserController.test.ts' 'test/services/user/comparePassword.test.ts' 'test/services/user/createHR.test.ts' 'test/services/user/isAdmin.test.ts' 'test/services/user/updateProfile.test.ts'` - 90 passing; expected validation-error logs in negative controller tests.
- [x] `grep` check for old dynamic update arrays, delete-by-ids boilerplate, and repeated row-not-found checks in Phase 6 CRUD/user target services - no matches.
- [x] `npm run check` - passing.

## Final Verification

- [x] `npm run check` - passing.
- [x] `npm run test` - 339 passing. Expected validation-error logs appeared in negative controller tests; pre-existing `pg` deprecation warning about concurrent `client.query()` appeared in some DB test paths.
- [x] Review diff for accidental API shape changes. `git status --short` and `git diff --stat` were clean before this final plan update, so no unreviewed source diff remained at final verification time.
- [x] Update this plan with completed phases, skipped items, blockers, and test results.

## Open Questions

- Resolved: no `userPublicMapper`/projection helper was kept. Public user reuse is done through `User.findById(...)`, `User.getAll(...)`, or direct same-domain imports only where needed to avoid circular runtime imports with the static `User` Facade.
- Resolved: CRUD helper extraction was completed with small helpers only (`assertFirstRow`, `buildUpdateSet`, `deleteByIds`, `quoteIdentifier`) plus focused tests; broad generic CRUD factories were intentionally avoided.