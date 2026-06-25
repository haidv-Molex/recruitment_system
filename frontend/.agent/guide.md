# Recruitment System — Developer & Agent Guide

> Đọc toàn bộ file này trước khi thực hiện bất kỳ thay đổi nào.

---

## 1. Tổng quan dự án

Ứng dụng **Recruitment System** là một hệ thống Single Page Application (SPA) xây dựng trên nền tảng **React + Vite** dùng để quản lý quy trình tuyển dụng, cơ sở dữ liệu ứng viên, theo dõi yêu cầu tuyển dụng và thư viện mô tả công việc (JD). API backend được kết nối qua biến môi trường `VITE_API_URL`.

**Tech Stack:**

- **Runtime:** Web Browser (React 18, Vite 4)
- **UI:** React 18, Tailwind CSS 3, Lucide-react
- **Routing:** React Router DOM 6
- **State:** React Context (AuthContext) và Zustand 5 (cho các config/state chung)
- **HTTP:** Axios với interceptor tự động (apiClient & axiosInstance)
- **Libraries:** Mammoth (đọc docx), pdfjs-dist (đọc pdf)

---

## 2. Cấu trúc thư mục

```
src/
├── App.tsx                    # Root component (đăng ký routes & wrap Provider)
├── main.tsx                   # Entry point
├── components/
│   ├── common/                # Shared UI components có logic/state nội bộ
│   │   ├── Button.tsx         # Button dùng chung
│   │   ├── InputField.tsx     # Input field dùng chung
│   │   ├── SelectField.tsx    # Select field dùng chung
│   │   ├── Toast.tsx          # Toast notification
│   │   ├── Layout.tsx         # Giao diện khung (Sidebar, Header)
│   │   ├── ProtectedRoute.tsx # Route guard bảo vệ phân quyền
│   │   ├── FilePreview.tsx    # Preview file (pdf, docx, image...)
│   │   ├── JDUploadForm.tsx   # Form upload JD
│   │   ├── UserForm.tsx       # Form quản lý user
│   │   └── index.ts           # Barrel export cho common/
│   └── ui/                    # Primitive UI elements — không có domain logic
│       ├── ExcelTable.tsx     # Bảng dữ liệu dạng Excel
│       ├── Modal.tsx          # Modal dialog
│       ├── Pagination.tsx     # Phân trang
│       ├── ConfirmModal.tsx   # Modal xác nhận
│       ├── CustomSkeleton.tsx # Loading skeleton
│       ├── MasterDataForm.tsx # Form dùng chung: code + name + description
│       ├── SimpleEntityForm.tsx # Form dùng chung: name + description
│       ├── OutlookSearchSelect.tsx
│       └── SingleSearchSelect.tsx
├── config/                    # Cấu hình core hệ thống
│   ├── axiosInstance.ts       # Axios instance có interceptors
│   ├── zustandStore.ts        # Zustand global store với TTL/expiry support
│   ├── ToastConfig.tsx        # Toast notification system
│   ├── globalErrorHandler.ts  # Tự động bắt lỗi window/promise
│   └── ReactErrorHandler.tsx  # Error Boundary cho giao diện
├── contexts/                  # React Contexts
│   └── AuthContext.jsx        # Quản lý trạng thái Auth và vai trò người dùng
├── hooks/                     # Custom Hooks
├── pages/                     # Các màn hình lớn (JobTracking, CandidateDatabase...)
├── services/                  # Các service gọi API và mock data
│   ├── api.js                 # Axios client cũ
│   └── authApi.js             # API Auth
├── styles/                    # ⚠️ TOÀN BỘ CSS đặt ở đây
│   └── index.css              # CSS file chính của dự án (Tailwind & Base CSS)
└── types/
    └── index.js               # Tài liệu định nghĩa cấu trúc dữ liệu ứng viên, JD...
```

---

## 3. Routing

Tất cả routes đăng ký trong `App.jsx`.

| Path            | Component             | Ghi chú                                   |
| --------------- | --------------------- | ----------------------------------------- |
| `/login`        | LoginPage             | Trang đăng nhập                           |
| `/`             | JobTrackingPage       | Trang chủ / Theo dõi yêu cầu tuyển dụng   |
| `/candidates`   | CandidateDatabasePage | Cơ sở dữ liệu ứng viên                    |
| `/master-data`  | MasterDataPage        | Quản lý danh mục                          |
| `/jd-library`   | JDLibraryPage         | Thư viện mô tả công việc (JD)             |
| `/companies`    | CompanyPage           | Quản lý công ty                           |
| `/departments`  | DepartmentPage        | Quản lý phòng ban                         |
| `/platforms`    | PlatformPage          | Quản lý kênh tuyển dụng                   |
| `/sites`        | SitePage              | Quản lý địa điểm làm việc                 |
| `/levels`       | LevelPage             | Quản lý cấp bậc tuyển dụng                |
| `/profile`      | ProfilePage           | Thông tin tài khoản                       |
| `/admin`        | AdminPage             | Chỉ Admin mới được quyền truy cập         |

---

## 4. Global State (Zustand)

### `zustandStore.ts` — App-wide store

Lưu trữ các trạng thái dùng chung cho toàn ứng dụng.

```ts
import { setItem, getItem, useItem, removeItem } from '@/config/zustandStore'

// React hook (reactive)
const isLogin = useItem('isLogin')

// Ngoài React (trong service, util)
const token = getItem('accessToken')
setItem('accessToken', newToken)
setItem('someKey', value, 60 * 60 * 1000) // với TTL 1 giờ
```

**Keys có sẵn:** `userId`, `userName`, `accessToken`, `isLogin`, `userRole`, `isNetWorkConnected`, `theme`.

---

## 5. API Layer

### Axios Instance (`axiosInstance.ts`)

- **baseURL:** `VITE_API_URL` (mặc định `http://localhost:3000`)
- **withCredentials: true** — cookie tự động gửi
- **Request interceptor:** tự gắn `Authorization: Bearer <token>`, kiểm tra trạng thái online.
- **Response interceptor:**
  - `result: false` → tự động hiển thị toast error.
  - `401` → tự động xoá token/user khỏi `localStorage` và chuyển hướng về `/login`.
  - `400/404/500` → hiển thị toast tương ứng.

---

## 6. Toast Notifications

```ts
import { showToast } from '@/config/ToastConfig'

// ⚠️ type LUÔN ĐỨNG TRƯỚC message
showToast('success', 'Thao tác thành công!')
showToast('error', 'Có lỗi xảy ra')
showToast('warning', 'Vui lòng kiểm tra lại thông tin')
showToast('error', 'Lỗi kết nối', 'Chi tiết lỗi cụ thể')

// ❌ SAI — đừng đảo ngược tham số
showToast('Thao tác thành công!', 'success') // WRONG
```

---

## 7. Styling Rules

### Quy tắc bắt buộc

- **Không inline style** (`style={{...}}`) trừ khi là giá trị động tính bằng JS.
- **Không hardcode màu HEX** trong component (`#1E40AF`, `#fff`), hãy sử dụng các class Tailwind CSS hoặc CSS Variables.
- **Toàn bộ CSS** phải nằm trong `src/styles/`.
- **Font:** `Inter`, `system-ui` — không dùng font lạ.
- Dùng `font-mono` cho các thông số hiển thị dạng code/số liệu cần căn đều.

---

## 8. Types

**Nguồn tham khảo dữ liệu:** `src/types/index.js`

Tài liệu ghi chú chi tiết về cấu trúc dữ liệu của `Candidate`, `RecruitmentRequest`, `JobDescription` và các đối tượng dữ liệu khác dùng trong dự án.

---

## 9. Quy tắc chung quan trọng

1. **Mỗi route mới** cần đăng ký trong `App.jsx`, thêm liên kết điều hướng vào menu/sidebar tương ứng.
2. **Không viết logic fetch data ở component con quá nhỏ** — hãy xử lý ở page-level hoặc qua store/context.
3. **Tránh vòng lặp vô hạn** với `useEffect`: luôn xác định rõ dependencies và memoize callbacks khi cần thiết.
4. **Đồng bộ hóa Auth:** Trạng thái đăng nhập được đồng bộ giữa `localStorage` (`authToken`, `recruitment_auth_user`) và các React component để đảm bảo tính nhất quán trên toàn app.

---

## 10. Path Aliases & Import Rules

| Alias | Trỏ đến   |
| ----- | --------- |
| `@/`  | `src/`    |

### ⚠️ Quy tắc bắt buộc về import

- **Luôn dùng `@/`** thay cho relative paths (`../../`, `../`) trong mọi file.
- **Không dùng** `import X from '../ui/Y'` hay `import X from '../../config/Y'`.

```ts
// ✅ ĐÚNG
import Button from '@/components/common/Button'
import ExcelTable from '@/components/ui/ExcelTable'
import axiosInstance from '@/config/axiosInstance'
import { useAuth } from '@/contexts/AuthContext'

// ❌ SAI
import Button from '../common/Button'
import ExcelTable from '../../components/ui/ExcelTable'
```

### Phân biệt `components/ui/` vs `components/common/`

| Thư mục | Nội dung | Ví dụ |
|---------|----------|-------|
| `components/ui/` | Primitive components — không chứa domain/business logic | `ExcelTable`, `Modal`, `Pagination`, `MasterDataForm`, `SimpleEntityForm` |
| `components/common/` | Shared components có thể chứa logic nội bộ, dùng bởi nhiều page | `Button`, `InputField`, `Layout`, `ProtectedRoute`, `FilePreview` |

> ❌ **Không tạo file trong `common/` chỉ để re-export từ `ui/`** — hãy import trực tiếp từ source.

---

## 11. Lệnh phát triển

```bash
npm run dev          # Khởi chạy Vite dev server ở cổng 5173
npm run build        # Build bản production
npm run preview      # Xem trước bản build production
npx vitest run       # Chạy toàn bộ unit tests
```

---

## 12. Shared UI Forms (components/ui/)

Thay vì tạo form mới cho mỗi entity cấu hình, hãy dùng 2 form dùng chung:

### `MasterDataForm` — entity có `code + name + description`

Dùng cho: **Department, Site, Level** (và bất kỳ entity tương tự).

```tsx
import MasterDataForm from '@/components/ui/MasterDataForm'

<MasterDataForm
  entityLabel="Department"
  codeLabel="Department Code"       // tuỳ chọn, mặc định: "Department Code"
  codePlaceholder="e.g. HR, IT..." // tuỳ chọn
  onSubmit={handleSubmit}
  onCancel={closeForm}
  initialData={editingItem ? { code, name, description } : undefined}
  isLoading={saving}
  error={formError}
/>
```

### `SimpleEntityForm` — entity có `name + description` (không có code)

Dùng cho: **Company, Platform** (và bất kỳ entity tương tự).

```tsx
import SimpleEntityForm from '@/components/ui/SimpleEntityForm'

<SimpleEntityForm
  entityLabel="Company"
  namePlaceholder="Enter company name..."  // tuỳ chọn
  onSubmit={handleSubmit}
  onCancel={closeForm}
  initialData={editingItem ? { name, description } : undefined}
  isLoading={saving}
  error={formError}
/>
```

> ❌ **Không tạo thêm** `CompanyForm`, `PlatformForm`, `DepartmentForm`... — dùng 2 form trên.