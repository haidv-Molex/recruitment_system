# Candidate Detail Split Plan - 2026-06-19

## Goal

Tách bớt các field bị trùng khỏi `candidate`, nhưng giữ nguyên schema `candidate_detail` hiện tại vì schema cũ của `candidate_detail` là đúng.

Nguyên tắc sửa từ 2026-06-19:

- Không thêm cột mới vào `candidate_detail`.
- Không thêm `candidate_id`, `agency`, `platform_id`, `job_id`, `reference`, hoặc bất kỳ field mới nào khác vào `candidate_detail` trong Phase 1.
- Chỉ loại bỏ khỏi `candidate` những field đã có tương ứng trong `candidate_detail`.
- Các field không trùng với `candidate_detail` vẫn giữ ở `candidate`.

## Confirmed Decisions

- `candidate_detail` schema hiện tại được xem là đúng và không sửa trong Phase 1.
- `address` đã bị xóa khỏi `candidate_detail`; không khôi phục cột này. Các layer code phải bỏ field `address` và dùng `location` cho thông tin địa điểm còn lại.
- `file_id` và `targeted_company` cũng đã bị xóa khỏi `candidate_detail`; không khôi phục hai cột này trong detail. Nếu flow còn cần CV file hoặc targeted company thì xử lý theo schema candidate/current flow, không thêm lại vào `candidate_detail`.
- `status` và `note` thuộc `candidate`.
- `agency` vẫn thuộc `candidate` vì không có trong schema `candidate_detail` hiện tại.
- `platform_id`, `job_id`, `reference` vẫn thuộc `candidate` vì không có trong schema `candidate_detail` hiện tại.
- `candidate_level` giữ nguyên hệ thống cũ và vẫn gắn với `candidate`; một candidate có thể có nhiều level.
- Route/service `/candidate-detail` vẫn tiếp tục tồn tại cho flow khác.
- `POST /candidate` và `PUT /candidate` vẫn dùng flat payload `name: value`.
- Backend service tự tách field theo ownership hiện tại của schema.
- `GET /candidate/search` phải search/filter toàn bộ thông tin candidate có thể truy cập theo schema hiện tại.
- Candidate table frontend hiển thị đầy đủ các cột HR cần; cột dài vẫn hiển thị dạng text/hover và HR có thể tự tắt cột không muốn xem.
- CandidateForm gom các field detail/CV/AI vào section riêng có thể collapse/expand.
- Không cần migration dữ liệu cũ. Database có thể xóa/recreate vì đây chưa phải dev cuối cùng.
- Lịch sử candidate sau này sẽ do bảng tracking/audit riêng xử lý, không làm trong phase này.

## Target Data Model For Phase 1

## `candidate`

`candidate` giữ:

- `candidate_id`
- `candidate_detail_id`
- `candidate_code`
- `candidate_name`
- `candidate_email`
- `candidate_phone`
- `agency`
- `status`
- `note`
- `platform_id`
- `job_id`
- `targeted_company`
- `reference`
- `file_id`
- `create_at`
- `update_at`

`candidate` bỏ các field sau trong Phase 1:

- `offer_date`
- `onboard_date`
- `expected_onboard_date`
- `feedback_date`
- `current_salary`
- `expected_salary`
Target schema Phase 1:

```sql
CREATE TABLE candidate (
    candidate_id SERIAL PRIMARY KEY,
    candidate_code VARCHAR(255),
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255),
    candidate_phone VARCHAR(50),
    agency VARCHAR(255),
    status VARCHAR(100) NOT NULL,
    note TEXT,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    candidate_detail_id INT,
    platform_id INT,
    job_id INT,
    targeted_company INT,
    reference INT,
    file_id INT,
    FOREIGN KEY (candidate_detail_id) REFERENCES candidate_detail(candidate_detail_id) ON DELETE SET NULL,
    FOREIGN KEY (platform_id) REFERENCES platform(platform_id) ON DELETE SET NULL,
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE SET NULL,
    FOREIGN KEY (targeted_company) REFERENCES company(company_id) ON DELETE SET NULL,
    FOREIGN KEY (reference) REFERENCES "user"(user_id) ON DELETE SET NULL,
    FOREIGN KEY (file_id) REFERENCES file(file_id) ON DELETE SET NULL
);
```

## `candidate_detail`

`candidate_detail` giữ nguyên schema hiện tại.

Không thêm:

- `candidate_id`
- `agency`
- `platform_id`
- `job_id`
- `reference`
- bất kỳ field mới nào khác trong Phase 1

Các field hiện có và tiếp tục giữ ở `candidate_detail`:

- `candidate_detail_id`
- `summary`
- personal/CV fields, excluding `address`
- `location` remains the location/place field
- `current_salary`
- `expected_salary`
- timeline dates
- `salary_currency`
- metadata `create_at`, `update_at`

## Column Ownership Map

| Field | Target table in Phase 1 | Note |
|---|---|---|
| `candidate_id` | `candidate` | Do not add to `candidate_detail` in Phase 1 |
| `candidate_detail_id` | `candidate` | FK linking candidate to the existing candidate_detail row |
| `candidate_code` | `candidate` | Keep |
| `candidate_name` | `candidate` | Keep, required |
| `candidate_email` | `candidate` | Keep |
| `candidate_phone` | `candidate` | Keep |
| `agency` | `candidate` | Keep because not in current `candidate_detail` schema |
| `status` | `candidate` | Keep, required |
| `note` | `candidate` | Keep |
| `platform_id` | `candidate` | Keep because not in current `candidate_detail` schema |
| `job_id` | `candidate` | Keep because not in current `candidate_detail` schema |
| `targeted_company` | `candidate` | Keep because it has been removed from current `candidate_detail` schema |
| `reference` | `candidate` | Keep because not in current `candidate_detail` schema |
| `file_id` | `candidate` | Keep because it has been removed from current `candidate_detail` schema |
| `offer_date` | `candidate_detail` | Remove duplicate from `candidate` |
| `onboard_date` | `candidate_detail` | Remove duplicate from `candidate` |
| `expected_onboard_date` | `candidate_detail` | Remove duplicate from `candidate` |
| `feedback_date` | `candidate_detail` | Remove duplicate from `candidate` |
| `current_salary` | `candidate_detail` | Remove duplicate from `candidate` |
| `expected_salary` | `candidate_detail` | Remove duplicate from `candidate` |

## API Contract Direction

## Address handling

Because `candidate_detail.address`, `candidate_detail.file_id`, and `candidate_detail.targeted_company` have been removed from the SQL schema:

- Do not add `address` back to `candidate_detail`.
- Do not add `file_id` back to `candidate_detail`.
- Do not add `targeted_company` back to `candidate_detail`.
- Remove `address` from `model/candidate_detail/candidate_detailModel.ts`.
- Remove `file_id` and `targeted_company` from `model/candidate_detail/candidate_detailModel.ts`.
- Remove `address` from `services/candidate_detail/types.ts` write data and write field list.
- Remove `file_id` and `targeted_company` from `services/candidate_detail/types.ts` write data and write field list.
- Remove `address` from `services/candidate_detail/mapCandidateDetailRow.ts`.
- Remove `file_id` and `targeted_company` from `services/candidate_detail/mapCandidateDetailRow.ts`.
- Remove `address` from `controller/candidate_detail/validation.ts` create/update/search schemas.
- Remove `file_id` and `targeted_company` from `controller/candidate_detail/validation.ts` create/update/search schemas.
- Remove `address` from `services/candidate_detail/getAll.ts` global search and per-field filters.
- Remove `file_id` and `targeted_company` from `services/candidate_detail/getAll.ts` search and joins.
- Remove `address`, `file_id`, and `targeted_company` from candidate_detail frontend DTOs and CandidateForm detail section.
- If AI parse CV returns detailed address-like data later, map broad place/city/province data to `location`; do not persist a separate `address` field unless the schema is explicitly changed later.
- If old frontend code still has `address`, `file_id`, or `targeted_company` for candidate_detail, ignore/drop it at mapper boundary rather than sending it to candidate_detail backend.

## `POST /candidate` and `PUT /candidate?id=...`

- Keep flat payload.
- Candidate-owned fields write to `candidate`.
- Detail-owned fields write to `candidate_detail` only where current schema supports them.
- Do not require nested `candidate` or `candidate_detail` request objects.
- Do not require adding columns to `candidate_detail` to make the request work.

## `GET /candidate?id=...`

- Candidate root data should include fields from `candidate`.
- Detail data can be nested under `candidate_detail` by following `candidate.candidate_detail_id`.
- Backend should not mutate the `candidate_detail` schema to achieve nesting.

## `GET /candidate/search`

- Search/filter across all candidate information available under current schema ownership.
- Candidate-owned filters/search: identity, `agency`, `status`, `note`, `platform`, `job`, `targeted_company`, `reference`, `file`.
- Detail-owned filters/search: salary, timeline dates, and CV/detail fields that still exist in `candidate_detail`.

## Frontend Direction

## CandidateTable

- Display full candidate data that HR needs.
- Long fields can show one-line text with hover detail.
- Wide table is acceptable because HR wants this and column visibility exists/should remain.

## CandidateForm

- Keep candidate core fields visible.
- Put candidate_detail/CV/AI fields in a collapsible section.
- Inputs can be plain text where appropriate.
- Submit flat payload.

## Backend Implementation Phases

## Phase 0 - Baseline

Completed on 2026-06-19:

- `npm run check`: passed.
- `npm run test:file 'test/controller/candidate/candidateController.test.ts'`: passed, 13 passing.
- `npm run test:file 'test/services/candidate/*.test.ts'`: failed baseline, 34 passing and 7 failing.
- No focused `candidate_detail` tests found.

The baseline service failures are recorded before source refactor and should not be treated as introduced by Phase 1.

## Phase 0B - Candidate Detail Code Cleanup

Status:

- [x] Completed on 2026-06-19.

Reason:

- `candidate_detail_shema.sql` has changed independently from the TypeScript/service/controller/frontend layers.
- Before touching `candidate` schema again, all files that depend on `candidate_detail` must match the current `candidate_detail` table exactly.
- The previous Phase 1 source edits were rolled back by the user, so this cleanup becomes the next required preparation step.

Current `candidate_detail` schema facts:

- Keep current `candidate_detail` columns as source of truth.
- `address` has been removed.
- `file_id` has been removed.
- `targeted_company` has been removed.
- Do not add `candidate_id`, `agency`, `platform_id`, `job_id`, `reference`, `file_id`, `targeted_company`, or `address` to `candidate_detail`.

Backend cleanup tasks:

- [x] Update `model/candidate_detail/candidate_detailModel.ts` to remove stale fields that no longer exist in SQL.
- [x] Update `services/candidate_detail/types.ts` write data and write field list to match SQL.
- [x] Update `services/candidate_detail/mapCandidateDetailRow.ts` to stop reading removed columns.
- [x] Update `services/candidate_detail/create.ts` and `update.ts` only if removed fields are still accepted/written through shared write fields.
- [x] Update `services/candidate_detail/getAll.ts` search columns, filters, joins, and params so it only uses fields that exist in `candidate_detail`.
- [x] Update `controller/candidate_detail/validation.ts` create/update/search schemas to reject or ignore removed fields consistently.
- [x] Update any candidate services/controllers that assume candidate_detail still has `address`, `file_id`, or `targeted_company`.

Frontend/API cleanup tasks:

- [x] Update candidate/candidate_detail frontend DTOs and service mappers to remove detail-owned `address`, `file_id`, and `targeted_company`.
- [x] Update `CandidateForm` detail section to use `location` instead of `address` and not submit removed detail fields.
- [x] Update `CandidateTable`/filters so detail filtering does not rely on removed detail columns.
- [x] If older UI state still has `address`, `file_id`, or `targeted_company` for detail, drop those fields at mapper boundary.

Frontend Phase 0B note:

- Scan found no frontend `candidate_detail` DTO/form/table fields for removed detail-owned `address`, `file_id`, or `targeted_company`.
- Existing frontend `targeted_company` usages belong to candidate/import flow, not candidate_detail, so Phase 0B did not remove them.

Verification:

- [x] `npm run check` from `backend/` passes after backend cleanup.
- [x] No backend source references `candidate_detail.address`, `candidate_detail.file_id`, or `candidate_detail.targeted_company`.
- [x] `npm run init-db` regenerates `init-db` with current candidate_detail schema.
- [x] Generated candidate_detail init SQL has no `address`, `file_id`, or `targeted_company`.
- [x] Frontend candidate form/table no longer treats those removed fields as candidate_detail fields.

Phase 0B result on 2026-06-19:

- Removed stale `address`, `file_id`, and `targeted_company` references from backend candidate_detail model, write types, mapper, search service, and validation schema.
- Fixed SQL syntax in `model/candidate_detail/candidate_detail_shema.sql` after column removals.
- Regenerated `init-db` with `npm run init-db`; generated candidate_detail SQL has no removed columns.
- `npm run check` passed.
- `npm run run-init-db` was not run.

## Phase 1 - Schema Refactor

Tasks:

- [x] Update `model/candidate/candidate_schema.sql` to remove only duplicate fields already present in `candidate_detail` after Phase 0B is complete.
- [x] Keep `candidate_detail_id`, `agency`, `platform_id`, `job_id`, `targeted_company`, `reference`, `file_id`, `status`, and `note` in `candidate`.
- [x] Do not add columns to `candidate_detail` during Phase 1.
- [x] Regenerate `init-db` after schema files are stable.
- [x] Run `npm run check`.

Verification:

- [x] Generated `init-db` candidate schema matches Phase 1 target.
- [x] Generated `init-db` candidate_detail schema remains unchanged except for user-approved schema edits already made before Phase 0B.
- [x] `npm run check` passes.

Phase 1 result on 2026-06-19:

- Re-run after Phase 0B cleanup completed.
- `model/candidate/candidate_schema.sql` now removes only timeline dates and current/expected salary from `candidate`.
- `model/candidate/candidate_schema.sql` keeps `candidate_detail_id`, `agency`, `platform_id`, `job_id`, `targeted_company`, `reference`, `file_id`, `status`, `note`, and identity fields.
- `model/candidate_detail/candidate_detail_shema.sql` was not modified during Phase 1.
- `init-db` regenerated successfully with `npm run init-db`.
- `npm run check` passed.
- `npm run run-init-db` was not run.

## Phase 2 - Service Split Logic

Tasks:

- [x] Update candidate create/update services so flat payload writes fields according to current schema ownership.
- [x] Do not add schema columns to `candidate_detail` during service work.
- [x] Drop/ignore `address`, `file_id`, and `targeted_company` in candidate_detail service/controller payload handling; keep `location` as the remaining place field.
- [x] Preserve `candidate_level` behavior on `candidate`.
- [x] Use `candidate.candidate_detail_id` to read/nest candidate_detail without changing its schema.

Phase 2 result on 2026-06-19:

- `services/candidate/create.ts` now creates a `candidate_detail` row first for detail-owned date/salary fields, then writes `candidate.candidate_detail_id` into the candidate row.
- `services/candidate/create.ts` keeps `agency`, `platform_id`, `job_id`, `targeted_company`, `reference`, `file_id`, `status`, `note`, identity fields, and candidate levels on candidate-owned flows.
- `services/candidate/update.ts` now sends date/salary updates to `CandidateDetailService.update(...)` through `candidate.candidate_detail_id`.
- `services/candidate/update.ts` creates a candidate_detail row and links it back to candidate if detail-owned fields are updated on a candidate without `candidate_detail_id`.
- `createWithAll` and `batchImport` continue to call `create(...)`, so their date/salary payloads use the new split logic indirectly.
- `npm run check` passed.
- `npm run run-init-db` was not run.

## Phase 3 - Candidate Search And Response

Tasks:

- [x] Update candidate populate/search according to current schema ownership.
- [x] Detail nesting/search should use `candidate.candidate_detail_id -> candidate_detail.candidate_detail_id`.
- [x] Candidate-owned relation joins stay rooted on `candidate` for `platform_id`, `job_id`, `targeted_company`, `reference`, and `file_id`.
- [x] Detail-owned joins/search use only existing `candidate_detail` fields. Do not join/search `targeted_company` or `file_id` through candidate_detail because those columns have been removed.

Phase 3 result on 2026-06-19:

- `services/candidate/populate.ts` now nests `candidate_detail` by calling `CandidateDetailService.getById(candidate_detail_id, pool)`.
- Candidate-owned relations remain at candidate root: `platform`, `job`, `targeted_company`, `reference`, `file`, and `candidate_levels`.
- `services/candidate/getAll.ts` now joins `candidate_detail cd ON c.candidate_detail_id = cd.candidate_detail_id` for detail-owned date/salary search.
- Candidate search date range filters now use `cd.offer_date`, `cd.onboard_date`, `cd.expected_onboard_date`, and `cd.feedback_date`.
- Candidate salary filters/search now use `cd.current_salary::text` and `cd.expected_salary::text`.
- `controller/candidate/getAllCandidatesController.ts` now accepts salary filters and date fields in `search_at`.
- `npm run check` passed.
- `npm run run-init-db` was not run.

## Phase 4 - Frontend Table/Form

Tasks:

- [ ] CandidateTable shows all candidate data HR needs, including long text columns with hover.
- [ ] CandidateForm keeps detail/CV/AI fields in collapsible section.
- [ ] CandidateForm should not include `address`; use `location` only.
- [ ] Frontend handles nested detail data if backend response provides it.

## Risks / Notes

- Do not modify `candidate_detail` schema in Phase 1.
- Do not add `platform_id`, `job_id`, `reference`, `candidate_id`, or `agency` to `candidate_detail` unless the user explicitly changes this decision later.
- Do not add `address`, `file_id`, or `targeted_company` back to `candidate_detail`; remove/ignore stale data in code and frontend.
- `npm run run-init-db` drops local data. Only run it when ready.

## Recommended Next Step

1. Start Phase 2 service split logic.
2. Keep `targeted_company` and `file_id` on candidate in service/controller work.
3. Do not add columns to `candidate_detail` during Phase 2.
