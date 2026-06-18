# API Contract Repair Plan - 2026-06-18

## Goal

Repair API contract drift introduced after the backend DRY refactor, with first priority on the candidate Excel batch import path where `candidate_email` no longer imports reliably.

The repair must preserve existing route paths, HTTP methods, response shapes, database schema, and transaction boundaries unless a later phase records an explicit reason to change them.

## Current Status

- Status: draft
- Owner: agent
- Created: 2026-06-18
- Phase 0 baseline started on 2026-06-18.
- Phase 0 baseline findings:
  - `npm run check` from `backend/` passed.
  - `test/services/file/parseCandidateSheet.test.ts` passed, 7 passing.
  - `test/services/candidate/batchImport.test.ts` passed, 3 passing.
  - `test/controller/candidate/candidateController.test.ts` passed, 9 passing, with expected validation-error logs in negative tests.
  - `test/controller/file/parseCandidateSheetController.test.ts` does not exist yet; this is a Phase 1 test gap.
  - Sample workbook reproduction confirms current candidate parse sheet selection chooses `IDL tracking`, which has no `Email` header; the correct candidate sheet is `Database`.
  - Batch import reproduction confirms `Candidate.batchImport(...)` preserves `candidate_email` when the payload already contains it, so the email loss happens before batch service persistence.
- Phase 1 completed on 2026-06-18:
  - Updated `parseCandidateSheetController` to select `Database` first for candidate workbook uploads, then a sheet with sample candidate headers, then the first non-empty sheet.
  - Kept job parsing behavior unchanged; `parseJobSheetController` still prefers `IDL tracking`.
  - Added parser service coverage for exact sample `Database` headers, `Source`, `EE Level`, and blank `Email`.
  - Added controller coverage for multi-sheet workbook uploads to prove `/file/parse-candidate-sheet` reads `Database`, not `IDL tracking`.
  - Verification passed: `parseCandidateSheet.test.ts` 9 passing, `parseCandidateSheetController.test.ts` 5 passing, `npm run check` passing.
- Phase 2 completed on 2026-06-18:
  - Added `frontend/src/services/candidateImportMapper.ts` as the shared mapper for candidate Excel import payloads.
  - Refactored `CandidateDatabase` batch import and `CandidateExcelImport` fallback import to use the shared mapper.
  - Candidate import now maps blank email to `null`, returns row-level errors for non-empty invalid email, maps `Source` to `platform_name`, and maps `EE Level` to `candidate_levels_name`.
  - Revised after manual feedback: invalid email rows no longer block all valid rows in the selected batch. Valid rows are sent to `/candidate/batch`; invalid email rows are returned as HR-facing errors.
  - Revised after manual feedback: invalid email messages now include the expected email format, for example `name@example.com`, and explain that spaces are not allowed.
  - Updated `createCandidateExtendedApi` fallback support for `candidate_levels_name`.
  - Verification passed: frontend service Vitest suite 22 passing, `CandidateExcelImport.test.tsx` 1 passing, `npm run build` passing with the existing Vite chunk-size warning. After the partial-import and email-format-message revisions, frontend service Vitest suite still passed 22 tests and `npm run build` still passed.
- Inputs reviewed first:
  - `backend/.agent/guide.md`
  - `backend/.agent/testGuide.md`
  - `backend/.agent/2026-06-18-dry-refactor-plan.md`
  - `frontend/.agent/guide.md`
- Audit coverage completed for:
  - `backend/controller/**/*.ts`
  - `frontend/src/services/**/*`
- Additional context reviewed because the email issue happens before/around service calls:
  - `backend/services/file/parseCandidateSheet.ts`
  - `backend/services/candidate/batchImport.ts`
  - `backend/utilities/file/getRowString.ts`
  - `backend/utilities/file/parseWorksheet.ts`
  - `frontend/src/pages/CandidateDatabase.tsx`
  - `frontend/src/components/candidate/CandidateExcelImport.tsx`
  - `frontend/src/pages/JobTracking.tsx`
- Sample workbook reviewed on 2026-06-18:
  - `backend/scratch/VIETNAM_IDL RECRUITMENT TRACKING (system).xlsx`
  - Sheets: `IDL tracking`, `Database`, `Data Validation`
  - Candidate import/export source sheet: `Database`
  - Candidate header row from sample: `Input date (dd/mm/yyyy)`, `Department`, `Name`, `Email`, `Phone number`, `Recruiter`, `Job code`, `Job title`, `EE Level`, `Project`, `Hiring manager`, `DL/IDL`, `Status`, `Onboarding Date (DD/MM/YYYY)`, `Offer Sent date\n(DD/MM/YYYY)`, `Source`, `Mã nhân viên`, `Người giới thiệu`, `Bộ phận`, `Note`, `Current salary \n(Gross M VND)`, `Expected salary\n(Gross M VND)`, `Candidate result feedback date`, `Headhunt Agency`, `Targeted company`, `Targeted company name`

## Summary Findings

- `frontend/src/services/candidateApi.ts` calls the candidate endpoints with the correct route paths:
  - `POST /file/parse-candidate-sheet`
  - `POST /candidate/batch`
  - `POST /candidate`, `POST /candidate/extended`, `PUT /candidate?id=...`, `GET /candidate/search`, `GET /candidate?id=...`, `DELETE /candidate`
- `backend/controller/candidate/batchImportCandidatesController.ts` still accepts `candidate_email` in each item, and `backend/services/candidate/batchImport.ts` still passes `candidate_email` to `create(...)`.
- Therefore, the candidate email regression is most likely before or at payload mapping, not inside `batchImportCandidatesApi(...)` itself.
- `backend/services/file/parseCandidateSheet.ts` reads email with `getRowString(row, "Email")`, which matches the exact visible header in the sample workbook.
- The sample workbook is the source of truth for candidate/job import and export headers. Do not broaden header aliases unless a new official sample/template is provided.
- The sample workbook contains both `IDL tracking` and `Database`. Candidate parsing must use the `Database` sheet. Current `backend/controller/file/parseCandidateSheetController.ts` prefers `IDL tracking` first, which does not contain the `Email` column and can explain why candidate email disappears before batch import.
- `frontend/src/pages/CandidateDatabase.tsx` maps parsed rows to batch payload and silently converts any email that fails its local regex into an empty string.
- `frontend/src/components/candidate/CandidateExcelImport.tsx` has a similar fallback per-row import path with its own local regex.
- Missing or blank candidate email is valid. Some candidates do not send email, so candidate import must allow `candidate_email` to be omitted or persisted as `null`.
- `frontend/src/pages/CandidateDatabase.tsx` does not send `platform_name` from parsed `source` in the batch payload, while the backend batch controller supports `platform_name`. This drops the sample workbook `Source` value during batch import.
- In UI and Excel import/export, the field name remains `Source` to match the sample workbook. In backend persistence, `Source` maps to the platform domain through `platform_name` or `platform_id`.
- The sample workbook `EE Level` column should import to `candidate_levels_name` so candidate levels follow the same visible Excel contract.
- If a non-empty candidate `Email` value is invalid, import should return a clear validation error to HR so they can fix the sheet. Do not silently normalize invalid non-empty email to `null`.
- Job API drift also exists:
  - `frontend/src/services/jobApi.ts` can append `partners` to `POST /job`, but `backend/controller/job/createJobController.ts` no longer accepts `partners` in source.
  - `frontend/src/services/jobApi.ts` can append `partners` and `partners_name` to `PUT /job`, but `backend/controller/job/updateJobController.ts` no longer accepts them in source.
  - `POST /job/extended` and `POST /job/batch` still accept `partners` and `partners_name`.
  - Current backend source models partners/HRBP through `department.user_id` and `job_department`, not a separate `job_business_partner` table.
- Job Excel import/export should preserve the sample workbook order. If export writes ordered HRBP/department data, import should read and map it in that same order.
- Minor service typing drift:
  - `frontend/src/services/userApi.ts` marks `createHRApi(...).password` optional, but `backend/controller/user/createHRController.ts` requires `password`.
  - `frontend/src/services/levelApi.ts`, `segmentApi.ts`, and `siteApi.ts` require `code` params even though the backend create controllers allow code to be optional.
  - Candidate update service appends most optional fields only when truthy, so clearing an existing optional value is not consistently possible from the frontend even though backend schemas accept empty/null values.

## Scope

Primary candidate import scope:
- `backend/controller/file/parseCandidateSheetController.ts`
- `backend/services/file/parseCandidateSheet.ts`
- `backend/utilities/file/getRowString.ts` or a new helper under `backend/utilities/file/`
- `backend/controller/candidate/batchImportCandidatesController.ts`
- `backend/services/candidate/batchImport.ts`
- `frontend/src/services/candidateApi.ts`
- `frontend/src/pages/CandidateDatabase.tsx`
- `frontend/src/components/candidate/CandidateExcelImport.tsx`
- Matching backend and frontend tests

Secondary API contract cleanup scope:
- `frontend/src/services/jobApi.ts`
- `backend/controller/job/createJobController.ts`
- `backend/controller/job/updateJobController.ts`
- `backend/services/job/create.ts`
- `backend/services/job/createWithAll.ts`
- `backend/services/job/update.ts`
- `backend/services/job/batchImport.ts`
- Matching job controller/service tests

Out of scope unless tests prove it is required:
- New route names or route mount changes
- Database schema changes
- Broad controller rewrites
- UI redesign
- Reintroducing a separate job partner link table without explicit confirmation

## Repair Rules

- Keep API response wrappers compatible: `{ result, message, data }` and existing `pagination` placement.
- Keep candidate batch import as `POST /candidate/batch` with body `{ candidates: [...] }`.
- Keep file parse as `POST /file/parse-candidate-sheet` with `multipart/form-data` field `file`.
- Treat `backend/scratch/VIETNAM_IDL RECRUITMENT TRACKING (system).xlsx` as the current import/export contract. Header names and user-visible labels should follow this workbook.
- For candidate parse, prefer sheet `Database` from the sample workbook. For job parse, prefer sheet `IDL tracking`.
- Do not fail a candidate row only because `Email` is blank or missing.
- Do fail a candidate row with a clear HR-facing validation message when `Email` is non-empty but invalid.
- Do not silently drop non-empty user-provided data in frontend mappers when the backend can validate it or when the plan requires explicit null handling.
- Keep the visible label `Source` in UI/export, while mapping it to backend `platform_name`/`platform_id` for persistence.
- Preserve job Excel import/export ordering from the sample workbook. Do not redesign the job HRBP/partner ordering contract in this repair.
- Prefer one shared mapper for candidate import payloads instead of duplicating local mapper logic in both page and component code.
- If a backend utility is created or expanded under `utilities/`, add mirrored tests under `backend/test/utilities/`.
- If backend service/controller behavior changes, run the most specific matching backend tests immediately.
- If frontend service DTO/mapping behavior changes, add or update Vitest coverage under `frontend/src/services/__tests__/` or a colocated component/helper test.
- Add browser-level smoke coverage for the import workflows after unit/controller tests pass. The browser test should exercise the same UI path HR uses instead of only calling services directly.

## Phase 0 - Baseline And Reproduction

Problem:
- The user reported that candidate email used to import successfully and now does not after the backend DRY refactor.
- The current failure needs a focused reproduction before editing source so the fix can be verified.

Plan:
- [x] Run `git status --short` and record any unrelated dirty files before changing source.
  - Result from backend repo: `A .agent/2026-06-18-api-contract-repair-plan.md` and `M .agent/2026-06-18-dry-refactor-plan.md`.
  - Note: the new repair plan is current work; the dry-refactor plan was already modified and should not be reverted as part of this task.
- [x] Run backend typecheck: `npm run check` from `backend/`.
  - Result: passing.
- [ ] Run focused backend tests that cover the current path:
  - [x] `npm run test:file 'test/services/file/parseCandidateSheet.test.ts'` - 7 passing; pre-existing `pg` deprecation warning about concurrent `client.query()`.
  - [x] `npm run test:file 'test/services/candidate/batchImport.test.ts'` - 3 passing; pre-existing `pg` deprecation warning about concurrent `client.query()`.
  - [ ] `npm run test:file 'test/controller/file/parseCandidateSheetController.test.ts'` - not run successfully because the test file does not exist. Command result: `No test files found`.
  - [x] `npm run test:file 'test/controller/candidate/candidateController.test.ts'` - 9 passing; expected validation-error logs in negative tests.
- [x] Add or identify a reproduction case where parsed candidate rows contain a real email and the final DB candidate row preserves `candidate_email`.
  - Result: direct `Candidate.batchImport(...)` reproduction inside a transaction imported `candidate_email: "phase0.email@example.com"`; DB read inside the same transaction returned `storedEmail: "phase0.email@example.com"`; transaction was rolled back.
- [x] Add or identify a reproduction case using the full sample workbook, proving `/file/parse-candidate-sheet` chooses sheet `Database` instead of `IDL tracking`.
  - Result: workbook sheets are `IDL tracking`, `Database`, `Data Validation`; current controller selection logic chooses `IDL tracking`; `IDL tracking` headers do not include `Email`; `Database` headers do include `Email`.
- [x] Add or identify a reproduction case using the sample workbook `Database` sheet and exact sample headers.
  - Result: sample `Database` headers were recorded in this plan and include `Name`, `Email`, `Phone number`, `Source`, and `EE Level`.
- [ ] Add or identify a reproduction case where a blank/missing `Email` cell imports successfully with `candidate_email: null` or omitted.
  - Status: not covered yet; add during Phase 1/3 tests.
- [ ] Add or identify a frontend mapper test showing that a parsed row with `candidate_email` becomes a batch payload with the same email.
  - Status: not covered yet; add during Phase 2 because no candidate import mapper test currently exists.

Verification:
- [x] Baseline failures are recorded in this plan before implementation.
- [x] At least one failing test or documented reproduction exists for the email regression before fixing it.
  - Documented reproduction: candidate parser selects `IDL tracking`, not `Database`, from the sample workbook, so candidate `Email` is unavailable before batch import.

## Phase 1 - Candidate Sample Workbook Contract

Problem:
- Candidate import/export must follow the provided sample workbook, especially the `Database` sheet headers.
- Earlier plan text assumed aliases such as `Email Address`, but the user confirmed the sample workbook's visible headers are the contract.
- `Email` is optional in the business workflow; a missing candidate email must not block import.
- `parseCandidateSheetController` currently prefers `IDL tracking` when a multi-sheet workbook is uploaded, but candidate rows live in the sample workbook's `Database` sheet.

Plan:
- [x] Update `parseCandidateSheetController` so candidate parsing chooses `Database` first, then falls back to a sheet with candidate `Database` headers, then the first non-empty sheet.
- [x] Keep `parseJobSheetController` preferring `IDL tracking` for job parsing.
- [x] Record the `Database` sheet header list from the sample workbook in the relevant parser tests.
- [x] Keep `parseCandidateSheet` aligned to exact sample headers: `Name`, `Email`, `Phone number`, `Recruiter`, `Job code`, `Job title`, `EE Level`, `Project`, `Hiring manager`, `DL/IDL`, `Status`, `Source`, `Mã nhân viên`, `Người giới thiệu`, `Bộ phận`, salary/date fields, agency, and targeted company fields.
- [x] Do not add broad alias/fuzzy header matching unless a future official sample changes.
- [x] Add or extend `parseCandidateSheet` tests using exact sample headers.
- [x] Add a parser test where `Email` is blank/null and parsing still returns a candidate row.
- [x] Add a parser test where `Source` and `EE Level` are preserved from the sample headers.
- [x] Add a controller test for a multi-sheet workbook shaped like the sample file, verifying `POST /file/parse-candidate-sheet` reads `Database`, not `IDL tracking`.

Verification:
- [x] `npm run test:file 'test/services/file/parseCandidateSheet.test.ts'` - 9 passing; pre-existing `pg` deprecation warning about concurrent `client.query()`.
- [x] `npm run test:file 'test/controller/file/parseCandidateSheetController.test.ts'` - 5 passing; expected AppError logs in negative tests.
- [x] `npm run check` - passing.

## Phase 2 - Candidate Batch Payload Mapping

Problem:
- `CandidateDatabase` and `CandidateExcelImport` duplicate candidate import mapping.
- Both places can blank out email locally with regex before sending the payload.
- Missing candidate email is valid, but the mapper should handle that intentionally instead of treating it as a failed import.
- `CandidateDatabase` does not send `platform_name` from parsed `source`, so the sample workbook `Source` value is lost in batch import.
- `EE Level` from the sample workbook is parsed as `ee_level` but is not currently mapped into candidate batch payload.

Plan:
- [x] Extract a shared candidate import payload mapper, preferably under `frontend/src/services/` if service-layer ownership is desired for API DTO conversion.
- [x] Make both `CandidateDatabase` batch import and `CandidateExcelImport` reuse the same mapper.
- [x] Normalize `candidate_email` by trimming it.
- [x] If `candidate_email` is blank or missing, send `null` or omit it so backend stores `candidate_email` as `null`.
- [x] Avoid treating blank email as an error.
- [x] For a non-empty invalid email string, surface a row-level validation message for HR and do not send a silently blanked value.
- [x] Allow valid selected rows to import even when other selected rows have invalid email values.
- [x] Include the expected email format in invalid email messages for HR: `name@example.com`, no spaces, with `@` and a domain.
- [x] Map parsed `source` to `platform_name` when no `platform_id` exists. UI and export labels stay `Source`.
- [x] Map parsed `ee_level` to `candidate_levels_name` because the sample workbook includes `EE Level` in the candidate `Database` sheet.
- [x] Preserve current fields already mapped correctly: `candidate_name`, `status`, `candidate_code`, phone, dates, salaries, recruiter, reference, targeted company, job code, project, and note.
- [x] Add frontend tests for the mapper with valid email, blank email, invalid email error, source/platform, `EE Level`, recruiter placeholder, reference name, and job code.
- [x] Keep `batchImportCandidatesApi(candidates)` as a thin transport function that posts `{ candidates }` to `/candidate/batch`.

Verification:
- [x] `npx vitest run src/services/__tests__` - 4 files passed, 22 tests passed. Re-runs after partial-import and email-format-message adjustments also passed 22 tests.
- [x] `npx vitest run src/components/candidate/__tests__/CandidateExcelImport.test.tsx` - 1 passing.
- [x] `npm run build` from `frontend/` - passing; Vite emitted the existing chunk-size warning. Re-runs after partial-import and email-format-message adjustments also passed with the same warning.

## Phase 3 - Backend Candidate Batch Guardrails

Problem:
- The backend candidate batch endpoint accepts `candidate_email`, but the schema is slightly less normalized than create/update schemas.
- Batch import should prove that if `candidate_email` is present in payload, it is inserted and returned through normal candidate reads.
- Batch import should also prove that missing/blank `candidate_email` is accepted.

Plan:
- [ ] Align `candidate_email` Joi behavior in `batchImportCandidatesController` with create/update schemas where appropriate: `.email().max(255).empty(["", "null"]).allow(null)`.
- [ ] Add a backend batch import service test proving `candidate_email` is persisted.
- [ ] Add a backend batch import service test proving blank/missing `candidate_email` imports successfully as `null`.
- [ ] Add a controller-level test for `POST /candidate/batch` with `candidate_email`.
- [ ] Add a controller-level test for `POST /candidate/batch` with blank/missing `candidate_email`.
- [ ] Add a negative test for non-empty invalid email returning a clear validation error.
- [ ] Add a test for `platform_name` in batch import because sample workbook `Source` maps to backend platform.
- [ ] Add a test for `candidate_levels_name` in batch import because sample workbook `EE Level` maps to candidate levels.
- [ ] Keep service ownership visible through existing `Candidate` facade from controllers.

Verification:
- [ ] `npm run test:file 'test/services/candidate/batchImport.test.ts'`
- [ ] `npm run test:file 'test/controller/candidate/candidateController.test.ts'`
- [ ] `npm run check`

## Phase 4 - Job Import/Export Contract Preservation

Problem:
- `frontend/src/services/jobApi.ts` still exposes fields that source backend base create/update controllers do not accept.
- `POST /job/extended` and `POST /job/batch` are the routes that currently accept partner/HRBP name fields.
- `PUT /job` does not accept `partners` or `partners_name` in source.
- The job workflow should keep the sample workbook's ordering contract: data exported in order should be importable in the same order.

Plan:
- [ ] Preserve job Excel labels and ordering from the sample workbook, especially `Dept.`, `HC Requested`, `Hiring manager`, `HRBP`, and `Recruiter`.
- [ ] Keep `parseJobSheetController` preferring `IDL tracking` and keep job import reading HRBP/department relationships in workbook order.
- [ ] Confirm whether `createJobApi` is still used anywhere. Current page code uses `createJobExtendedApi` for new jobs.
- [ ] If `createJobApi` is dead, remove it or make it match `backend/controller/job/createJobController.ts` exactly without changing the Excel import/export contract.
- [ ] If `createJobApi` must stay and callers need partner/HRBP fields, align the backend route or route callers through `createJobExtendedApi` without changing workbook-order behavior.
- [ ] For `updateJobApi`, align unsupported `partners` and `partners_name` handling with the backend route or explicitly keep update paths away from those fields; do not change batch import ordering.
- [ ] Keep `partners` and `partners_name` in `createJobExtendedApi` and `batchImportJobsApi` because those controllers accept them.
- [ ] Clarify in code/tests that job HRBP/partner values from Excel are mapped in order to department ownership fields such as `department.user_id` and batch payload `partner_name`.
- [ ] Add/update frontend service tests for job create/update payload field filtering.
- [ ] Add/update backend controller tests around `POST /job`, `POST /job/extended`, `PUT /job`, and `POST /job/batch` so the accepted field set and order-based import contract cannot drift silently again.

Verification:
- [ ] `npm run test:file 'test/controller/job/jobController.test.ts'` from `backend/`
- [ ] `npm run test:file 'test/services/job/createWithAll.test.ts' 'test/services/job/updateWithAll.test.ts' 'test/services/job/batchImport.test.ts'` from `backend/`
- [ ] `npx vitest run src/services/__tests__` from `frontend/`
- [ ] `npm run check` from `backend/`
- [ ] `npm run build` from `frontend/`

## Phase 5 - Frontend Service DTO Tightening

Problem:
- Some frontend service function signatures are looser or stricter than the backend controller schemas.
- This is not the candidate email root cause, but it makes future API drift easier.

Plan:
- [ ] Make `createHRApi` require `password` in its TypeScript input type to match `createHRController`.
- [ ] Decide whether `levelApi`, `segmentApi`, and `siteApi` should allow optional code params because backend create schemas allow empty/optional code.
- [ ] Review candidate create/update FormData append behavior for optional fields that users may need to clear.
- [ ] Add service tests for optional null/empty handling where the frontend should explicitly send a clear operation.
- [ ] Avoid changing visible UI behavior unless required by API contract correctness.

Verification:
- [ ] `npx vitest run src/services/__tests__`
- [ ] `npm run build` from `frontend/`

## Phase 6 - Browser E2E Smoke Test

Problem:
- Unit, service, and controller tests can prove API contracts, but the reported bug appears in the real upload and import workflow used by HR.
- The final confidence check should run through the browser with the sample workbook and visible UI states.

Plan:
- [ ] Start backend and frontend dev servers locally.
- [ ] Open the app in an automated browser session.
- [ ] Log in with a valid HR/Admin test account, or use the existing test auth setup if the repo provides one.
- [ ] Navigate to the candidate database/import UI.
- [ ] Upload `backend/scratch/VIETNAM_IDL RECRUITMENT TRACKING (system).xlsx` through the candidate Excel import modal.
- [ ] Confirm the preview rows come from sheet `Database`, not `IDL tracking`.
- [ ] Confirm preview shows sample fields from the candidate sheet: `Email`, `Source`, `EE Level`, recruiter, job code, status, and candidate name.
- [ ] Import a small selected subset, preferably including one row with valid email and one row with blank email.
- [ ] Confirm successful import feedback appears in the UI and the candidate table/search displays imported values.
- [ ] Exercise a row with non-empty invalid email and confirm HR sees a clear validation error instead of silent email removal.
- [ ] Run the job import/export smoke path if Phase 4 changes job service/controller behavior: export workbook, import it back, and confirm ordered HRBP/department data is preserved.
- [ ] Capture screenshots or browser logs for any UI/API failure and record them in this plan before fixing further.

Verification:
- [ ] Browser smoke: candidate Excel parse selects `Database` sheet.
- [ ] Browser smoke: valid `Email` is preserved after import.
- [ ] Browser smoke: blank `Email` imports successfully.
- [ ] Browser smoke: invalid non-empty `Email` shows a clear HR-facing error.
- [ ] Browser smoke: `Source` persists via platform mapping while the UI/export label remains `Source`.
- [ ] Browser smoke: `EE Level` persists via candidate level mapping.
- [ ] Browser smoke: job export/import order is preserved if job code changes are included.

## Final Verification

- [ ] Backend: `npm run check`
- [ ] Backend focused tests:
  - [ ] `npm run test:file 'test/utilities/file/*.test.ts'`
  - [ ] `npm run test:file 'test/services/file/parseCandidateSheet.test.ts' 'test/services/candidate/batchImport.test.ts'`
  - [ ] `npm run test:file 'test/controller/file/parseCandidateSheetController.test.ts' 'test/controller/candidate/candidateController.test.ts'`
  - [ ] `npm run test:file 'test/controller/job/jobController.test.ts'`
- [ ] Frontend: `npx vitest run src/services/__tests__`
- [ ] Frontend: `npm run build`
- [ ] Browser E2E smoke test from Phase 6.
- [ ] Manual smoke test:
  - [ ] Upload `backend/scratch/VIETNAM_IDL RECRUITMENT TRACKING (system).xlsx` through candidate import and confirm `/file/parse-candidate-sheet` selects `Database`, not `IDL tracking`.
  - [ ] Confirm exact sample `Database` headers are read.
  - [ ] Import a row with a valid `Email` value and confirm DB row keeps `candidate_email`.
  - [ ] Import a row with blank/missing `Email` and confirm import succeeds with `candidate_email: null`.
  - [ ] Import a row with non-empty invalid `Email` and confirm HR receives a clear validation error.
  - [ ] Import a row with `Source` and confirm batch import creates/links the platform through `platform_name` while UI/export still displays `Source`.
  - [ ] Import a row with `EE Level` and confirm batch import creates/links candidate levels through `candidate_levels_name`.
  - [ ] Export then import a job workbook and confirm ordered HRBP/department data is preserved.
  - [ ] Create/update/import a job through the current UI path and confirm no `partners không được phép` validation error appears.
- [ ] Update this plan with completed phases, skipped items, blockers, and test results.

## Resolved Decisions

- The official sample workbook for this repair is `backend/scratch/VIETNAM_IDL RECRUITMENT TRACKING (system).xlsx`.
- Visible Excel headers from the sample workbook are the import/export contract. Do not add alias support unless another official template is provided.
- Candidate import reads the sample workbook's `Database` sheet. Job import reads the sample workbook's `IDL tracking` sheet.
- Candidate `Email` may be blank or missing; that must not block import.
- Non-empty invalid candidate `Email` should fail that row/import with a clear validation error for HR to correct.
- The visible field name remains `Source` in UI and Excel import/export. Backend import maps that value to the platform domain through `platform_name` when `platform_id` is absent.
- Candidate `EE Level` from the sample workbook should be mapped to `candidate_levels_name` during batch import.
- Job import/export should keep the sample workbook order. Exported ordered job data should import back in the same order.

## Remaining Question

- None at this time.