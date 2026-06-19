# Candidate Identity Plan

**Goal**: Make candidate email unique, auto-generate candidate codes in `V00001` format, and make batch import update existing candidates by email.

**Scope**:
- Candidate create/update service identity handling.
- Candidate batch import upsert behavior.
- Candidate SQL schema source for code/email constraints.
- Focused service tests for the HR requirement.

**Checklist**:
- [x] Add helper for normalized candidate email/code, next code generation, and duplicate checks.
- [x] Update create/update services to use auto code and email/code uniqueness guards.
- [x] Update batch import to find candidates by email and update them, preserving code unless import provides one.
- [x] Update candidate schema source with trigger and unique indexes for new DB initialization.
- [x] Add focused DB-backed service tests.
- [x] Run TypeScript check and focused tests.

**Affected Files/Modules**:
- `services/candidate/identity.ts`
- `services/candidate/create.ts`
- `services/candidate/update.ts`
- `services/candidate/batchImport.ts`
- `model/candidate/candidate_schema.sql`
- `test/services/candidate/identity.test.ts`

**Verification Commands**:
- `npm run check`
- `npm run test:file -- test/services/candidate/identity.test.ts`

**Current Status**: Completed. Type check passed and focused candidate identity tests passed.