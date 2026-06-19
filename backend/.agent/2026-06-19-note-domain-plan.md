# Note Domain Plan

**Goal**: Add a reusable note table owned by HR users, link notes to jobs and candidates, expose note CRUD APIs, and return `notes: []` from candidate/job APIs instead of a scalar `note` response.

**Scope**:
- New `note` domain model, schema, services, controller, and route mounting.
- Link tables for `candidate_note` and `job_note`.
- Candidate and job create/update/import compatibility: incoming legacy `note` text is saved as a linked note by the authenticated user when available.
- Candidate/job read APIs populate `notes: []`; search filters include linked note messages.
- Focused DB-backed service tests for note CRUD/link behavior plus type check.

**Checklist**:
- [x] Inspect existing CRUD/schema/test conventions for note implementation.
- [x] Add note SQL schema, TS models, services, facade, and controller CRUD.
- [x] Wire `/note` controller in app entrypoint.
- [x] Update candidate/job services and controllers to create/link notes and return `notes: []`.
- [x] Add mirrored service tests for note behavior.
- [!] Run init-db generation, type check, and focused tests.

**Affected Files/Modules**:
- `model/note/*`
- `model/linking/candidate_note/*`
- `model/linking/job_note/*`
- `services/note/*`
- `controller/note/*`
- `services/candidate/*`, `controller/candidate/*`
- `services/job/*`, `controller/job/*`
- `index.ts`
- `tsconfig.json`
- `test/services/note/*`

**Verification Commands**:
- `npm run init-db` - passed; generated local ignored `init-db` SQL files including `note`, `job_note`, and `candidate_note`.
- `npm run check` - passed.
- `npx ts-node -e "import './controller/job/createJobController'; console.log('controller import ok')"` - passed after enabling `ts-node.files` so global Express declarations load during `npm run start`.
- `npm run test:file -- test/controller/job/jobController.test.ts` - passed.
- `npm run test:file -- test/controller/candidate/candidateController.test.ts` - passed.
- `npm run test:file -- "test/services/note/*.test.ts"` - blocked because local DB has not been migrated/reinitialized with the new `note` table (`relation "note" does not exist`).
- `npm run run-init-db` - not run because it drops and recreates `public` schema; needs explicit approval or a disposable local DB.

**Current Status**: Implementation complete. Focused note tests are written but require applying the new schema to the local database before they can pass.