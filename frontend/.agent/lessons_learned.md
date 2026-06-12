# Frontend Knowledge & Lessons Learned

> **Purpose:** Guidelines and lessons from real development sessions for AI agents
> working on this project. Read this before modifying any component.

---

## 1. ExcelTable Component (`src/components/ui/ExcelTable.tsx`)

### Key Props

| Prop | Type | Purpose |
|---|---|---|
| `rows` | `T[]` | Data rows passed from parent |
| `columns` | `ExcelColumn<T>[]` | Column definitions |
| `actions` | `ExcelAction<T>[]` | Row actions shown in toolbar (NOT inline per-row anymore) |
| `onSearch` | `(colFilters, globalSearch) => void` | When set, disables local filtering and delegates to parent (API query) |
| `isLoading` | `boolean` | Shows an inline spinner in tbody; does NOT unmount the table |
| `disableFilter` | on `ExcelColumn` | Hides the filter input for that column |
| `disableTruncate` | on `ExcelColumn` | Disables single-line truncation for that column (use for status badges, file badges) |

### ExcelAction Interface

Actions are NO LONGER rendered per-row (no action column on the right).
They appear in the **toolbar** and react to the checkbox selection state:

```ts
interface ExcelAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;          // called when exactly 1 row selected
  onBulkClick?: (rows: T[]) => void;  // called when 2+ rows selected
}
```

**Selection rules:**
- **0 selected** → all action buttons are dimmed (`opacity-40 cursor-not-allowed`)
- **1 selected** → all actions enabled
- **2+ selected** → only actions with `onBulkClick` are enabled; others stay dimmed

**Example usage in a page:**
```tsx
const tableActions = [
  {
    label: 'Edit',
    icon: <Edit2 size={14} />,
    onClick: (row) => openEditForm(row),
    // no onBulkClick → disabled for multi-select
  },
  {
    label: 'Delete',
    icon: <Trash2 size={14} />,
    onClick: (row) => deleteSingle(row),
    onBulkClick: (rows) => {
      requestDeleteJobs(
        rows.map((r) => r.id),
        `Bạn có chắc chắn muốn xóa ${rows.length} công việc đã chọn không?`
      );
    },
  },
];
```

### 1.1 ConfirmModal Component (`src/components/ui/ConfirmModal.tsx`)

A custom styled confirmation modal to replace native browser `confirm()` windows. It supports danger/warning/info variants, backdrop blur, Escape to cancel, and Enter to confirm.

```tsx
<ConfirmModal
  isOpen={isOpen}
  title="Xác nhận"
  message="Bạn có chắc chắn muốn thực hiện hành động này?"
  confirmLabel="Xác nhận"
  cancelLabel="Hủy"
  variant="danger"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

### Checkbox Column (Sticky Left)

- A **sticky left checkbox column** is added automatically when `actions` is provided.
- The column does NOT scroll horizontally with the rest of the table (`position: sticky; left: 0`).
- Each row's sticky cell background is explicitly set to match the row's alternating color so content doesn't bleed through during horizontal scroll.
- "Select all" checkbox in the header uses `indeterminate` state when only some rows are selected.
- Selection is **cleared automatically** when `rows` prop changes (e.g., after a search or page navigation).

### Critical Rule — Never Conditionally Unmount ExcelTable

ExcelTable holds its filter state (`columnFilters`, `globalSearch`) in local React state.
**If you conditionally render ExcelTable** (e.g., `{loading ? <Spinner> : <ExcelTable>}`),
it **unmounts and remounts** on every fetch, **wiping the user's filter inputs**.

✅ **Correct pattern:**
```tsx
// Always mounted — loading state shown via spinner row inside tbody
<ExcelTable
  rows={jobs}
  columns={columns}
  isLoading={loading}        // ← show spinner row, keep component alive
  onSearch={handleSearch}
/>
```

❌ **Wrong pattern:**
```tsx
{loading
  ? <div>Loading...</div>    // ← this unmounts ExcelTable and resets filters!
  : <ExcelTable rows={jobs} ... />
}
```

### API-Driven Filtering (`onSearch`)

When `onSearch` is provided:
- Local filtering is **completely bypassed** — `rows` is rendered as-is.
- The toolbar shows a green **Search** button next to **Clear**.
- Pressing **Enter** in any filter input also fires `onSearch`.
- **Clear** calls `onSearch({}, '')` so the parent can reload unfiltered data.
- Clear button turns red when any filter is active.

### Column Key → API Param Mapping (Job Tracking)

When wiring `onSearch` in a page, you must map ExcelTable column keys to backend
query param names. Example from `JobTracking.tsx`:

```ts
const COLUMN_KEY_TO_API: Record<string, string> = {
  jobCode:        'job_code',
  project:        'project',
  department:     'department',
  jobTitle:       'job_title',
  eeLevel:        'ee_level',
  sites:          'site',
  projectSegment: 'segment',
  hiringManager:  'manager',
  hrbp:           'partner',
  note:           'note',
};
```

Non-filterable columns (status, file, dates, numeric fields) should set
`disableFilter: true` in their column definition to hide the filter row input.

---

## 2. Pagination Component (`src/components/ui/Pagination.tsx`)

### Key Props

| Prop | Type | Purpose |
|---|---|---|
| `currentPage` | `number` | Current active page |
| `totalPages` | `number` | Total number of pages |
| `totalItems` | `number` | Total record count |
| `onPageChange` | `(page) => void` | Called when user navigates |
| `pageSize` | `number` (optional) | Currently selected page size |
| `onPageSizeChange` | `(size) => void` (optional) | Shows page-size selector when provided |
| `pageSizeOptions` | `number[]` (optional) | Defaults to `[10, 20, 50, 100]` |
| `itemLabel` | `string` (optional) | Label shown after count, e.g. `"jobs"` |

### Always use the project Pagination

Never write an inline pagination bar from scratch. Always use `<Pagination>` from
`src/components/ui/Pagination.tsx`. If it's missing a feature (e.g., page size
selector), **extend that component**, not the page.

---

## 3. Server-Side Pagination + Filtering Pattern

When a page uses server-side data (API), follow this pattern:

```tsx
// 1. State
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const [totalItems, setTotalItems] = useState(0);
const [activeSearchParams, setActiveSearchParams] = useState<Record<string, any>>({});
const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

// 2. Load function accepts extra search params
const loadData = useCallback(async (page, limit, extraParams = {}) => {
  setLoading(true);
  const result = await searchApi({ page, limit, ...extraParams });
  setData(result.data || []);
  setTotalItems(result.pagination?.total_items ?? 0);
  setCurrentPage(page);
  setLoading(false);
}, []);

// 3. Table search handler — saves params so pagination preserves them
const handleTableSearch = useCallback((colFilters, globalSearch) => {
  const params = buildApiParams(colFilters, globalSearch);
  setActiveSearchParams(params);
  loadData(1, pageSize, params);
}, [loadData, pageSize]);

// 4. Pagination preserves active search params
const handlePageChange = (page) => loadData(page, pageSize, activeSearchParams);
const handlePageSizeChange = (size) => { setPageSize(size); loadData(1, size, activeSearchParams); };
```

---

## 4. Backend Advanced Search (`services/job/getAll.ts`)

The job getAll service supports:
- `search` — global text across job_code, project, note, request_date, and all
  relation tables (department, segment, site, level, manager, partner) via EXISTS subqueries.
- Per-field filters: `job_code`, `project`, `department`, `segment`, `site`,
  `job_title`, `ee_level`, `manager`, `partner`, `note`, `request_date_from`, `request_date_to`.

All filters use `ILIKE` (case-insensitive). Multiple filters are combined with `AND`.

---

## 5. Sidebar & Layout Rules

- Sidebar background: **`bg-white`** / **`bg-slate-50`** (light, not dark).
- Layout wrapper: **`h-screen w-screen overflow-hidden`** — never use height:auto on root layout.
- Sidebar bottom profile button → navigates to `/profile`.
- Logout button lives **only** on the `/profile` page.
- Nested navigation items (Companies, Department, Platform, Segment, Site, Level)
  are grouped under a collapsible "Configuration" section in the sidebar.
- The `/master-data` route has been deleted; do not re-add it.

---

## 6. Cell Truncation & Hover Tooltips

- All table cells are single-line (`truncate whitespace-nowrap overflow-hidden text-ellipsis`).
- Hovering a truncated cell shows a **floating dark tooltip** (`fixed`, `z-[9999]`)
  that follows the mouse cursor — implemented via `onMouseEnter/Move/Leave` on `td`.
- Columns that should NOT be truncated (status badges, file badges, rendered components)
  set `disableTruncate: true` in the column definition.
- The tooltip only appears when the cell is actually overflowing (`scrollWidth > clientWidth`).

---

## 7. Modal Rendering

- Never nest `<Modal>` wrappers inside components that are already rendered inside a `<Modal>`.
- If a form/import component has its own internal modal, don't wrap it again.
- Candidate detail modals in `CandidateDatabase.tsx` were fixed by removing outer `<Modal>` wrappers.

---

## 8. CORS / API Setup

- Frontend dev server: **port 5173** (Vite default).
- Backend: **port 3000**.
- CORS must explicitly allow `http://localhost:5173`.
- `axiosInstance` is configured at `src/config/axiosInstance.ts` — always use
  this instance, never raw `axios`, to ensure auth headers are forwarded.
