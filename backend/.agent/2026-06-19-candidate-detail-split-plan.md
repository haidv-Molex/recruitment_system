# Candidate Detail Split Plan - 2026-06-19

## Goal

Tách bảng `candidate` và `candidate_detail` để schema rõ ownership hơn, nhưng vẫn giữ trải nghiệm sử dụng như một hồ sơ ứng viên đầy đủ.

Quyết định hiện tại: một `candidate` chỉ có một `candidate_detail`.

Điều này nghĩa là `candidate_detail` không còn đại diện cho nhiều lần ứng tuyển hoặc lịch sử ứng tuyển. Nó là phần mở rộng chi tiết của `candidate`, dùng để chứa các field dài, field parse từ CV, field ít nhập tay, và các thông tin ứng viên mở rộng.

## Confirmed Decisions

- Một `candidate` chỉ có một `candidate_detail`.
- `candidate_detail` bắt buộc được tạo cùng lúc khi tạo `candidate`, kể cả khi detail mới chỉ có dữ liệu rỗng/partial.
- Không dùng bảng linking `candidate_candidate_detail`.
- Quan hệ target là 1-1 bằng FK trực tiếp: `candidate_detail.candidate_id`.
- Cần enforce 1-1 bằng `UNIQUE(candidate_id)` trong `candidate_detail`.
- `status` và `note` thuộc `candidate`.
- `POST /candidate` quay lại dạng flat payload: tất cả field gửi dạng `name: value`, không nested `candidate`/`candidate_detail`.
- Backend service tự tách flat payload thành phần lưu vào `candidate` và phần lưu vào `candidate_detail`.
- `GET /candidate/search` phải tìm kiếm/filter trên toàn bộ thông tin của candidate, bao gồm cả field trong `candidate_detail` và các relation liên quan.
- Candidate list/table ở frontend phải có đủ dữ liệu để hiển thị và filter toàn bộ thông tin candidate đó.
- `CandidateForm` phải gom các field thuộc `candidate_detail` vào một section riêng có thể ẩn/hiện dạng dropdown/collapsible, vì đa số field này được fill bằng AI parse CV hơn là nhập tay.
- `candidate_level` giữ nguyên hệ thống cũ và vẫn gắn với `candidate`; một candidate có thể có nhiều level.
- Route/service `/candidate-detail` vẫn tiếp tục tồn tại để dùng cho các flow khác.
- Không cần migration dữ liệu cũ. Database có thể xóa/recreate vì đây chưa phải dev cuối cùng.

## Target Data Model

## `candidate`

`candidate` giữ các field chính, thường dùng trong workflow, table, status, note, và định danh ứng viên.

Giữ ở `candidate`:

- `candidate_id`
- `candidate_code`
- `candidate_name`
- `candidate_email`
- `candidate_phone`
- `status`
- `note`
- `create_at`
- `update_at`

Schema target gợi ý:

```sql
CREATE TABLE candidate (
    candidate_id SERIAL PRIMARY KEY,
    candidate_code VARCHAR(255),
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255),
    candidate_phone VARCHAR(50),
    status VARCHAR(100) NOT NULL,
    note TEXT,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## `candidate_detail`

`candidate_detail` là phần mở rộng 1-1 của `candidate`.

Nên có:

- `candidate_detail_id SERIAL PRIMARY KEY`
- `candidate_id INT NOT NULL UNIQUE REFERENCES candidate(candidate_id) ON DELETE CASCADE`
- `agency`
- `platform_id`
- `job_id`
- `targeted_company`
- `reference`
- `file_id`
- `offer_date`
- `expected_onboard_date`
- `onboard_date`
- `feedback_date`
- `summary`
- `date_of_birth`
- `gender`
- `marital_status`
- `nationality`
- `location`
- `address`
- `links`
- `skills`
- `languages`
- `language_details`
- `education`
- `education_details`
- `experience_years`
- `current_position`
- `current_level`
- `current_salary`
- `last_company`
- `work_experience`
- `work_experience_details`
- `certifications`
- `expected_position`
- `expected_level`
- `expected_salary`
- `expected_work_location`
- `salary_currency`
- `create_at`
- `update_at`

Foreign keys:

- `candidate_id -> candidate(candidate_id) ON DELETE CASCADE`
- `platform_id -> platform(platform_id) ON DELETE SET NULL`
- `job_id -> job(job_id) ON DELETE SET NULL`
- `targeted_company -> company(company_id) ON DELETE SET NULL`
- `reference -> "user"(user_id) ON DELETE SET NULL`
- `file_id -> file(file_id) ON DELETE SET NULL`

Important constraint:

```sql
candidate_id INT NOT NULL UNIQUE
```

This enforces exactly one detail row per candidate at the database level.

## Remove Obsolete Linking Table

Remove from target design:

- `model/linking/candidate_candidate_detail/candidate_candidate_detail_schema.sql`
- `model/linking/candidate_candidate_detail/candidate_candidate_detail.ts`
- Any generated `init-db/*candidate_candidate_detail*` file after regeneration.

## Column Ownership Map

| Field | Target table | Note |
|---|---|---|
| `candidate_id` | both | PK in `candidate`, FK unique in `candidate_detail` |
| `candidate_code` | `candidate` | Identity/list field |
| `candidate_name` | `candidate` | Required |
| `candidate_email` | `candidate` | Identity/contact |
| `candidate_phone` | `candidate` | Identity/contact |
| `status` | `candidate` | User confirmed |
| `note` | `candidate` | User confirmed |
| `agency` | `candidate_detail` | Sourcing detail |
| `platform_id` | `candidate_detail` | Source/platform relation |
| `job_id` | `candidate_detail` | Job relation |
| `targeted_company` | `candidate_detail` | Company relation |
| `reference` | `candidate_detail` | User relation |
| `file_id` | `candidate_detail` | CV file relation |
| timeline dates | `candidate_detail` | Offer/onboard/feedback dates |
| salary fields | `candidate_detail` | Numeric detail fields |
| parsed CV fields | `candidate_detail` | AI/import-fill fields |

## API Contract

## `POST /candidate`

Use flat payload.

Do not require nested `candidate` or `candidate_detail` objects.

Example JSON request:

```json
{
  "candidate_code": "CAND-001",
  "candidate_name": "Nguyen Van A",
  "candidate_email": "a@example.com",
  "candidate_phone": "+84.123.456",
  "status": "CV Sent",
  "note": "Potential senior candidate",
  "agency": "Navigos",
  "platform_id": 1,
  "job_id": 2,
  "targeted_company": 3,
  "reference": 4,
  "offer_date": "2026-06-19",
  "expected_onboard_date": "2026-07-01",
  "current_salary": 10000000,
  "expected_salary": 15000000,
  "skills": ["React", "Node.js"],
  "languages": ["English"],
  "education": "...",
  "work_experience": "..."
}
```

For multipart form-data with file upload, still keep flat fields:

- `candidate_name=value`
- `status=value`
- `skills=[...]` if frontend sends JSON string for array fields
- `language_details=[...]` if frontend sends JSON string for JSON fields
- `file=<CV file>`

Backend responsibility:

- Parse/validate flat body.
- Split fields internally into `candidateData` and `candidateDetailData`.
- Insert `candidate`.
- Insert exactly one `candidate_detail` with the created `candidate_id`. This detail row is required for every candidate.
- Upload file and store `file_id` on `candidate_detail`.
- Return a single populated candidate object with nested `candidate_detail`.

## `PUT /candidate?id=...`

Use flat payload as well.

Backend responsibility:

- Candidate-owned fields update `candidate`.
- Detail-owned fields upsert/update the single `candidate_detail` row for that `candidate_id`.
- If candidate exists but detail row does not, create it.
- File update stores new `file_id` on `candidate_detail`.

## `GET /candidate?id=...`

Return one candidate record with complete information.

Recommended response shape for frontend convenience:

- Keep candidate fields at root.
- Include detail data inside nested `candidate_detail`.
- Detail relations can be nested under `candidate_detail` as well, for example `candidate_detail.platform`, `candidate_detail.job`, `candidate_detail.targeted_company`, `candidate_detail.reference`, `candidate_detail.file`.

Target response sketch:

```json
{
  "candidate_id": 1,
  "candidate_code": "CAND-001",
  "candidate_name": "Nguyen Van A",
  "candidate_email": "a@example.com",
  "candidate_phone": "+84.123.456",
  "status": "CV Sent",
  "note": "...",
  "candidate_detail": {
    "candidate_detail_id": 10,
    "candidate_id": 1,
    "agency": "Navigos",
    "skills": ["React"],
    "languages": ["English"],
    "platform": null,
    "job": null,
    "targeted_company": null,
    "reference": null,
    "file": null
  }
}
```

Frontend is responsible for reading nested data and flattening/mapping it for table/form display when needed.

## `GET /candidate/search`

Candidate search must search/filter across all candidate information:

- Candidate fields: name, code, email, phone, status, note.
- Detail fields: agency, timeline dates, salary, CV parsed fields, location, skills, languages, education, work experience, expected position, etc.
- Relation fields: job code/project, platform code/name, company name, reference user name, file path if needed.

Implementation direction:

- Join `candidate_detail cd ON cd.candidate_id = c.candidate_id`.
- Join relation tables from detail: `job`, `platform`, `company`, `user`, `file`.
- Global `search` scans all useful fields.
- Per-field filters should exist for table filters where UI exposes them.
- Because relation is 1-1, each candidate should join to at most one detail row, but keep SQL clear and safe.

## `GET /candidate-detail/search`

Can remain as a lower-level detail-focused API, but the main UI should be able to use `GET /candidate/search` for full table filtering.

## Backend Implementation Phases

## Phase 0 - Baseline

Tasks:

- [ ] Record current candidate API response contract.
- [ ] Run `npm run check` from `backend/`.
- [ ] Run focused candidate controller/service tests if present.
- [ ] Record any pre-existing failures before edits.

## Phase 1 - Schema Refactor

Tasks:

- [ ] Update `model/candidate/candidate_schema.sql`:
  - Keep identity fields.
  - Keep `status` and `note`.
  - Remove detail-owned fields after services are updated.
- [ ] Update `model/candidate_detail/candidate_detail_shema.sql`:
  - Add `candidate_id INT NOT NULL UNIQUE`.
  - Add FK to `candidate(candidate_id) ON DELETE CASCADE`.
  - Add missing relation fields: `agency`, `platform_id`, `job_id`, `reference`.
  - Keep `targeted_company`, `file_id`, timeline, salary, and parsed CV fields.
- [ ] Remove obsolete `candidate_candidate_detail` model files.
- [ ] Update `candidateModel.ts` and `candidate_detailModel.ts`.
- [ ] Regenerate `init-db` after source SQL is stable.
- [ ] Reset DB only when ready, since `npm run run-init-db` drops local data.

Verification:

- [ ] Generated init SQL has no `candidate_candidate_detail` table.
- [ ] Fresh DB can initialize.
- [ ] Schema enforces one detail per candidate via unique `candidate_id`.

## Phase 2 - Candidate Create/Update Services

Tasks:

- [ ] Define field ownership constants/helpers for flat payload splitting.
- [ ] Update `services/candidate/create.ts`:
  - Insert candidate-owned fields into `candidate`.
  - Upload file if present.
  - Insert candidate_detail-owned fields into `candidate_detail` with created `candidate_id`.
  - Always create the detail row, even if the incoming detail subset is empty.
- [ ] Update `services/candidate/update.ts`:
  - Update candidate-owned fields.
  - Upsert detail-owned fields by `candidate_id`.
  - Keep candidate levels logic if still used.
- [ ] Update `createWithAll` and `batchImport` to use the same split logic.
- [ ] Ensure salary values are numeric-compatible before writing to `NUMERIC` columns.

Verification:

- [ ] Create candidate creates exactly one detail row.
- [ ] Create candidate creates detail row even when no detail fields are provided.
- [ ] Update detail-owned fields does not create duplicate detail rows.
- [ ] Updating candidate-owned fields does not overwrite unrelated detail fields.

## Phase 3 - Candidate Controllers And Validation

Tasks:

- [ ] Keep `createCandidateController` accepting flat body/form-data fields.
- [ ] Keep `updateCandidateController` accepting flat body/form-data fields.
- [ ] Expand Joi schemas to include all candidate_detail fields that can be manually submitted or AI-filled.
- [ ] For array/JSON fields in multipart form-data, support JSON string parsing where needed.
- [ ] Remove nested payload requirements from the plan/source.
- [ ] Keep route paths unchanged unless explicitly requested.

Verification:

- [ ] `POST /candidate` with flat candidate + detail fields succeeds.
- [ ] `PUT /candidate?id=...` with flat detail fields updates the single detail row.
- [ ] Invalid `gender`, `marital_status`, dates, salary, JSON arrays return clear validation errors.

## Phase 4 - Candidate Populate And Response Mapping

Tasks:

- [ ] Update `services/candidate/populate.ts` to load the single detail row by `candidate_id`.
- [ ] Populate detail relations:
  - `platform`
  - `job`
  - `targeted_company`
  - `reference`
  - `file`
- [ ] Return nested `candidate_detail` in candidate responses.
- [ ] Do not flatten candidate_detail fields at backend response level. Frontend table/form code must read nested detail data and map it for display.
- [ ] Update `Candidate.getById(...)` and `Candidate.getAll(...)` expectations.

Verification:

- [ ] `GET /candidate?id=...` returns complete candidate + nested `candidate_detail` data.
- [ ] `GET /candidate/search` rows contain enough data for `CandidateTable` without extra detail fetch.

## Phase 5 - Candidate Search Across All Fields

Tasks:

- [ ] Update `services/candidate/getAll.ts` to join `candidate_detail` directly.
- [ ] Global search should include:
  - candidate_code, candidate_name, candidate_email, candidate_phone, status, note
  - agency, location, education, skills, languages, work_experience, certifications
  - current/expected salary, current/expected position, timeline dates
  - platform/job/company/reference names
- [ ] Add per-field filters for table filter UI as needed.
- [ ] Update `controller/candidate/getAllCandidatesController.ts` query schema to include candidate_detail filters.
- [ ] Keep `GET /candidate-detail/search` as detail-level API, but do not rely on it for main candidate table filtering.
- [ ] Keep standalone candidate_detail CRUD routes/services available for other workflows; create/upsert must respect the unique `candidate_id` rule.

Verification:

- [ ] Candidate search can filter by fields from both tables.
- [ ] Candidate search response includes all fields needed by `CandidateTable`.

## Frontend Plan

## Phase F1 - Candidate Table Shows Full Candidate Data

Target file: `frontend/src/components/candidate/CandidateTable.tsx`

Current issue:

- Table currently shows a small mock-oriented set: name, position, department, status, applied date, score.
- It does not reflect all candidate/candidate_detail fields.

Tasks:

- [ ] Update table columns to display the candidate data actually used by recruitment workflow:
  - candidate code
  - name
  - email
  - phone
  - status
  - job/project
  - platform/source
  - agency
  - targeted company
  - reference
  - current position
  - current salary
  - expected salary
  - expected work location
  - key timeline dates
  - skills/languages summary
  - file/CV indicator if available
  - note summary
- [ ] Use horizontal scroll/dense table layout; do not hide important fields permanently.
- [ ] Add or wire filters so table can filter on the full candidate dataset through `GET /candidate/search`.
- [ ] Keep row actions stable: edit/delete/select.

Verification:

- [ ] Candidate table renders complete candidate rows returned by backend, including nested `candidate_detail` fields.
- [ ] Filters call candidate search with matching query params.
- [ ] No extra request is required per row just to show candidate detail fields.

## Phase F2 - Candidate Form Detail Section

Target file: `frontend/src/components/candidate/CandidateForm.tsx`

Current issue:

- Form mixes candidate and detail fields across sections.
- Many candidate_detail fields are not represented yet.
- Candidate detail fields are usually AI/CV imported, not manually typed.

Tasks:

- [ ] Keep core candidate fields visible by default:
  - candidate name
  - status
  - candidate code
  - email
  - phone
  - note
- [ ] Keep common workflow fields visible or in concise sections:
  - job
  - platform/source
  - agency
  - targeted company
  - reference
  - timeline dates
  - current/expected salary
  - CV file
- [ ] Add a collapsible/dropdown section for detailed CV/AI fields:
  - summary
  - date_of_birth
  - gender
  - marital_status
  - nationality
  - location
  - address
  - links
  - skills
  - languages
  - language_details
  - education
  - education_details
  - experience_years
  - current_position
  - current_level
  - last_company
  - work_experience
  - work_experience_details
  - certifications
  - expected_position
  - expected_level
  - expected_work_location
  - salary_currency
- [ ] Default the detail section collapsed for manual create/edit.
- [ ] Auto-expand the detail section after AI CV import fills fields, or show a compact filled-count badge.
- [ ] Keep submit payload flat: every form field maps to top-level `name: value` expected by backend.

Verification:

- [ ] Manual user can create candidate without touching detail section.
- [ ] AI import can fill detail fields and user can review them by expanding the section.
- [ ] Submit sends flat payload.

## Phase F3 - Candidate API/DTO Mapping

Tasks:

- [ ] Update `frontend/src/services/candidateApi.ts` DTOs to include all detail fields at the frontend boundary.
- [ ] Keep create/update payload flat.
- [ ] Make search API accept all candidate/detail filter params.
- [ ] Add frontend mapper/helpers to read nested `candidate_detail` and adapt it for table/form display.

Verification:

- [ ] Create/update/search calls preserve all fields.
- [ ] Candidate table and form consistently handle the nested `candidate_detail` shape.

## Import And AI CV Plan

Tasks:

- [ ] Parse CV output maps primarily to candidate_detail fields.
- [ ] Candidate identity fields from parsed CV map to candidate fields:
  - name
  - email
  - phone
- [ ] AI import should fill form state with flat field names.
- [ ] Detail section should show imported values for review.
- [ ] Excel import should also send flat rows, while backend splits candidate/detail fields internally.

Verification:

- [ ] AI CV parse fills candidate identity + collapsible detail section.
- [ ] Import creates one candidate and one detail.
- [ ] Re-import/update does not create duplicate detail for same candidate unless explicitly creating a new candidate.

## Test Plan

Backend:

- [ ] `npm run check`
- [ ] Candidate create creates exactly one candidate_detail row.
- [ ] Candidate update upserts one detail row and does not duplicate it.
- [ ] Candidate getById returns all candidate/detail fields.
- [ ] Candidate search filters across both tables.
- [ ] Candidate delete cascades candidate_detail.
- [ ] Candidate_detail standalone CRUD respects `UNIQUE(candidate_id)`.

Frontend:

- [ ] CandidateTable renders full candidate fields.
- [ ] CandidateTable filter calls include detail filters.
- [ ] CandidateForm submits flat payload.
- [ ] CandidateForm detail section collapses/expands.
- [ ] AI import fills detail section fields.

## Risks

- Backend returns nested `candidate_detail`; frontend must intentionally read/map nested data for table/form display.
- One-to-one detail means candidate_detail is not the history mechanism. Candidate history will be handled later by a dedicated tracking/audit table that records CRUD activity across the system, including candidate changes.
- `candidate_detail.candidate_id UNIQUE` will reject duplicate detail creation; update paths must upsert by candidate_id.
- Candidate table can become very wide, but this is acceptable for HR workflow. The frontend already has or should keep column visibility controls so users can hide columns they do not need.
- `npm run run-init-db` drops local data. Only run it when ready.

## Recommended First Implementation Step

1. Change `candidate_detail` schema to direct one-to-one FK: `candidate_id INT NOT NULL UNIQUE`.
2. Remove `candidate_candidate_detail` target files.
3. Update candidate create/update service to split flat payload internally and upsert exactly one detail row.
4. Update candidate get/search to join and return full candidate information.
5. Update frontend `CandidateTable` and `CandidateForm` around the final flat candidate shape.
