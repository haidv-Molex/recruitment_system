# DRY Refactor Plan - 2026-06-18

## Goal

Refactor old backend code to follow the new `.agent/guide.md` rule: before writing SQL, mapper, or business logic, reuse existing `services/`, `utilities/`, and `model/` code, or extract shared helpers instead of repeating logic.

The refactor must preserve existing API response shapes, route behavior, database schema, and transaction boundaries.

## Current Status

- Status: in progress
- Owner: agent
- Created: 2026-06-18
- Phase 0 baseline completed successfully on 2026-06-18.
- Phase 1 revised on 2026-06-18 after user feedback: use Facade class calls such as `User.findById(...)` and `Department.getById(...)`, not direct function imports or SQL fragment/mapper helpers.
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
- [x] Update `services/user/_User.ts` to lazy-load methods so services inside `services/user/` can safely call `User.findById(...)` without circular import issues.
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
- [ ] Create `utilities/query/buildWhereClause.ts` for joining conditions safely.
- [ ] Create `utilities/query/buildDateRangeConditions.ts` for date range filters with parameter indexing handled by params length.
- [ ] Create `utilities/query/buildPagination.ts` for default page/limit/offset/unlimited handling.
- [ ] Create `utilities/query/mapChartRows.ts` for `ChartDataPoint[]` mapping.
- [ ] Refactor dashboard services first because dashboard tests already exist.
- [ ] Refactor CRUD `getAll` services after dashboard helpers are stable.

Verification:
- [ ] Add tests for new query utilities under `test/utilities/query/`.
- [ ] `npm run test:file 'test/services/dashboard/*.test.ts'`
- [ ] Run or add CRUD getAll tests where available.
- [ ] `npm run check`

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
- [ ] Create `utilities/entity/normalizeLookupKey.ts`.
- [ ] Create `utilities/entity/buildEntityMap.ts`.
- [ ] Create `utilities/entity/resolveEntity.ts` for lookup with optional placeholder creation.
- [ ] Create `utilities/entity/resolveAndCreateEntities.ts` for batch import use.
- [ ] Refactor candidate and job batch import to use the shared resolver.
- [ ] Refactor file parsers to use shared entity map and relation resolution helpers.

Safety notes:
- Keep table and column names as code-owned config, not user-controlled input.
- Preserve current case-insensitive behavior and original casing when creating missing entities.

Verification:
- [ ] Add tests for `utilities/entity/*`.
- [ ] `npm run test:file 'test/services/candidate/batchImport.test.ts'`
- [ ] Run job batch/createWithAll tests where present.
- [ ] `npm run test:file 'test/services/file/parseCandidateSheet.test.ts'`
- [ ] `npm run test:file 'test/services/file/parseJobSheet.test.ts'`

## Phase 4 - File Parser Field Helpers

Problem:
- `parseCandidateSheet` and `parseJobSheet` repeat `String(row[header]).trim()` and date parsing logic.
- Existing `utilities/file/*` helpers cover worksheet/cell extraction, but not service-level row field normalization.

Known affected files:
- `services/file/parseCandidateSheet.ts`
- `services/file/parseJobSheet.ts`
- Existing helper area: `utilities/file/`

Plan:
- [ ] Add `utilities/file/getRowString.ts` or `utilities/file/parseRowField.ts`.
- [ ] Add `utilities/file/getRowDate.ts`.
- [ ] Add optional batch field mapper only if it reduces real repetition without hiding meaning.
- [ ] Refactor parser services to use these helpers.

Verification:
- [ ] Add tests under `test/utilities/file/` for whitespace, null, undefined, empty strings, dates, and numeric-looking strings.
- [ ] `npm run test:file 'test/services/file/parseCandidateSheet.test.ts'`
- [ ] `npm run test:file 'test/services/file/parseJobSheet.test.ts'`

## Phase 5 - Linking Helpers For Many-To-Many Tables

Problem:
- Candidate and job create/update repeat delete/insert/validate patterns for linking tables.

Known affected files:
- `services/candidate/create.ts`
- `services/candidate/update.ts`
- `services/job/create.ts`
- `services/job/update.ts`

Plan:
- [ ] Create a small helper such as `utilities/db/linking.ts`.
- [ ] Add `assertExistingIds` for FK validation.
- [ ] Add `insertLinks` for simple two-column links.
- [ ] Add `replaceLinks` for update paths that delete old rows then insert new rows.
- [ ] Keep special columns such as `candidate_required` explicit and readable.
- [ ] Refactor candidate levels first because it is simpler.
- [ ] Refactor job relations after helper behavior is covered.

Verification:
- [ ] Add tests for linking utilities using real DB transactions where needed.
- [ ] `npm run test:file 'test/services/candidate/create.test.ts'`
- [ ] `npm run test:file 'test/services/candidate/update.test.ts'`
- [ ] `npm run test:file 'test/services/job/createWithAll.test.ts'`
- [ ] `npm run test:file 'test/services/job/updateWithAll.test.ts'`

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
- [ ] Add missing service tests before broad CRUD refactor.
- [ ] Extract tiny helpers first: `assertRowFound`, `buildUpdateSet`, `deleteByIds`.
- [ ] Avoid large generic factories until tests prove the local variations are understood.
- [ ] Refactor one domain at a time and run its mirrored tests immediately.

Verification:
- [ ] Domain-specific service tests for each touched source file.
- [ ] `npm run check`

## Final Verification

- [ ] `npm run check`
- [ ] `npm run test`
- [ ] Review diff for accidental API shape changes.
- [ ] Update this plan with completed phases, skipped items, blockers, and test results.

## Open Questions

- Decide final location for user projection helpers: `services/user/` keeps ownership close to user service behavior; `model/user/` keeps type/projection definitions near the user model.
- Decide whether CRUD helper extraction should happen in this refactor or after adding missing tests for basic domains.