# Recruitment System — Frontend

Ứng dụng **Single Page Application (SPA)** quản lý toàn bộ quy trình tuyển dụng: theo dõi yêu cầu tuyển dụng, cơ sở dữ liệu ứng viên, thư viện JD, và quản lý danh mục hệ thống.

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Framework | React 18 |
| Build tool | Vite 4 |
| Ngôn ngữ | TypeScript |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM 6 |
| State | React Context + Zustand 5 |
| HTTP Client | Axios (với interceptors tự động) |
| Icons | Lucide React |
| Đọc file | Mammoth (`.docx`), pdfjs-dist (`.pdf`) |
| Testing | Vitest + happy-dom |

---

## Yêu cầu hệ thống

- **Node.js** >= 18
- **npm** >= 9
- Backend API đang chạy tại `http://localhost:3000` (xem `recruitment_system/backend`)

---

## Cài đặt & Khởi chạy

### 1. Cài dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` tại thư mục gốc của frontend (hoặc sửa file đã có):

```env
VITE_API_URL=http://localhost:3000
```

### 3. Khởi chạy dev server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:5173**

### 4. Các lệnh khác

```bash
npm run build      # Build production (output: dist/)
npm run preview    # Preview bản build production
npx vitest run     # Chạy toàn bộ unit tests
```

---

## Cấu trúc thư mục

```
src/
├── App.tsx                        # Root — đăng ký routes & wrap Providers
├── main.tsx                       # Entry point
│
├── components/
│   ├── common/                    # Shared components có logic/state nội bộ
│   │   ├── Button.tsx
│   │   ├── InputField.tsx
│   │   ├── SelectField.tsx
│   │   ├── StatCard.tsx
│   │   ├── Toast.tsx
│   │   ├── Layout.tsx             # Sidebar + Header
│   │   ├── ProtectedRoute.tsx     # Route guard phân quyền
│   │   ├── FilePreview.tsx        # Preview PDF/DOCX/ảnh
│   │   ├── JDUploadForm.tsx       # Form upload Job Description
│   │   ├── UserForm.tsx           # Form quản lý tài khoản HR
│   │   └── index.ts               # Barrel export
│   │
│   └── ui/                        # Primitive UI — không có domain logic
│       ├── ExcelTable.tsx          # Bảng dữ liệu dạng Excel
│       ├── Modal.tsx
│       ├── Pagination.tsx
│       ├── ConfirmModal.tsx
│       ├── CustomSkeleton.tsx
│       ├── MasterDataForm.tsx      # Form dùng chung: code + name + description
│       ├── SimpleEntityForm.tsx    # Form dùng chung: name + description
│       ├── OutlookSearchSelect.tsx
│       └── SingleSearchSelect.tsx
│
├── config/
│   ├── axiosInstance.ts           # Axios có interceptors (auth, toast, refresh token)
│   ├── zustandStore.ts            # Global store với TTL/expiry
│   ├── ToastConfig.tsx            # Hệ thống toast notification
│   ├── globalErrorHandler.ts      # Bắt lỗi window/unhandledRejection
│   └── ReactErrorHandler.tsx      # Error Boundary cho UI
│
├── contexts/
│   ├── AuthContext.tsx             # Trạng thái đăng nhập & vai trò
│   └── HeaderContext.tsx           # Dynamic page title/action buttons
│
├── hooks/
│   └── useToast.ts                # Hook quản lý toast notifications
│
├── pages/
│   ├── LoginPage.tsx
│   ├── Dashboard.tsx              # Tổng quan KPI & ứng viên gần đây
│   ├── JobTracking.tsx            # Theo dõi yêu cầu tuyển dụng
│   ├── CandidateDatabase.tsx      # Cơ sở dữ liệu ứng viên
│   ├── CompanyPage.tsx
│   ├── DepartmentPage.tsx
│   ├── PlatformPage.tsx
│   ├── SegmentPage.tsx
│   ├── SitePage.tsx
│   ├── LevelPage.tsx
│   ├── AdminPage.tsx              # Chỉ Admin
│   └── ProfilePage.tsx
│
├── services/                      # API calls & mock data
└── types/                         # Định nghĩa kiểu dữ liệu
```

---

## Routing

| Path | Trang | Quyền |
|---|---|---|
| `/login` | LoginPage | Public |
| `/` | Dashboard | Đã đăng nhập |
| `/jobs` | JobTrackingPage | Đã đăng nhập |
| `/candidates` | CandidateDatabasePage | Đã đăng nhập |
| `/companies` | CompanyPage | Đã đăng nhập |
| `/departments` | DepartmentPage | Đã đăng nhập |
| `/platforms` | PlatformPage | Đã đăng nhập |
| `/segments` | SegmentPage | Đã đăng nhập |
| `/sites` | SitePage | Đã đăng nhập |
| `/levels` | LevelPage | Đã đăng nhập |
| `/profile` | ProfilePage | Đã đăng nhập |
| `/admin` | AdminPage | Chỉ Admin |

---

## Quy ước code

### Import paths — luôn dùng `@/`

```ts
// ✅ Đúng
import Button from '@/components/common/Button'
import ExcelTable from '@/components/ui/ExcelTable'
import axiosInstance from '@/config/axiosInstance'
import { useAuth } from '@/contexts/AuthContext'

// ❌ Sai
import Button from '../common/Button'
import ExcelTable from '../../components/ui/ExcelTable'
```

Alias `@` trỏ đến `./src` — được cấu hình trong `vite.config.js`.

### Shared Forms

Khi cần form cho một entity cấu hình mới, **không tạo form riêng** — dùng 2 shared form trong `components/ui/`:

**`MasterDataForm`** — entity có `code + name + description` (Department, Segment, Site, Level...):

```tsx
import MasterDataForm from '@/components/ui/MasterDataForm'

<MasterDataForm
  entityLabel="Department"
  codeLabel="Department Code"       // tuỳ chọn
  codePlaceholder="e.g. HR, IT..."  // tuỳ chọn
  onSubmit={handleSubmit}
  onCancel={closeForm}
  initialData={editingItem ? { code, name, description } : undefined}
  isLoading={saving}
  error={formError}
/>
```

**`SimpleEntityForm`** — entity có `name + description` (Company, Platform...):

```tsx
import SimpleEntityForm from '@/components/ui/SimpleEntityForm'

<SimpleEntityForm
  entityLabel="Company"
  onSubmit={handleSubmit}
  onCancel={closeForm}
  initialData={editingItem ? { name, description } : undefined}
  isLoading={saving}
  error={formError}
/>
```

### Toast Notifications

```ts
import { showToast } from '@/config/ToastConfig'

showToast('success', 'Thao tác thành công!')
showToast('error', 'Có lỗi xảy ra')
showToast('warning', 'Vui lòng kiểm tra lại', 'Chi tiết lỗi...')
showToast('info', 'Đang tải dữ liệu...')
```

> ⚠️ Tham số thứ nhất **luôn là type**, thứ hai là message.

### Global State (Zustand)

```ts
import { setItem, getItem, useItem, removeItem } from '@/config/zustandStore'

// Trong React component (reactive)
const isLogin = useItem('isLogin')

// Ngoài React (trong service, util)
const token = getItem('accessToken')
setItem('accessToken', newToken)
setItem('someKey', value, 60 * 60 * 1000) // với TTL 1 giờ
```

---

## Axios & API

- **Base URL:** `VITE_API_URL` (mặc định `http://localhost:3000`)
- **withCredentials: true** — cookie tự động gửi kèm
- **Request interceptor:** gắn `Authorization: Bearer <token>`, kiểm tra trạng thái mạng
- **Response interceptor:**
  - `result: false` → hiển thị toast error tự động
  - `401` → tự động refresh token, nếu thất bại → logout + redirect `/login`
  - `400/404/500` → hiển thị toast tương ứng

---

## Testing

```bash
npx vitest run          # Chạy toàn bộ test một lần
npx vitest              # Chạy ở watch mode
npx vitest run --coverage  # Kèm coverage report
```

Test files đặt tại `__tests__/` trong cùng thư mục với component tương ứng.

---

## Môi trường

| Biến | Mô tả | Mặc định |
|---|---|---|
| `VITE_API_URL` | Base URL của backend API | `http://localhost:3000` |
