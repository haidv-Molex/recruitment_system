# Hệ Thống Quản Lý Tuyển Dụng (Recruitment System) 🚀

Hệ thống quản lý quy trình tuyển dụng toàn diện, bao gồm cơ sở dữ liệu ứng viên, theo dõi yêu cầu tuyển dụng (Headcount Tracking), và thư viện mô tả công việc (JD Library). 

Dự án được chia thành 2 phần chính:
* **Backend**: REST API phục vụ dữ liệu, bảo mật, thời gian thực và quản lý database.
* **Frontend**: Giao diện người dùng Single Page Application (SPA) hiện đại, trực quan.

---

## 📂 Cấu Trúc Dự Án

Thư mục gốc của dự án được cấu trúc như sau:

```
recruitment_system/
├── backend/            # Mã nguồn Server (Node.js + Express + TS)
│   ├── .agent/         # Hướng dẫn chi tiết dành cho AI Agent & Developers
│   ├── dist/           # Code JavaScript sau khi build
│   ├── init-db/        # Chứa schema database đã compile
│   ├── src/ (or root)  # Controller, Services, Model, Middlewares
│   └── test/           # Unit test và integration test
│
├── frontend/           # Mã nguồn Client (React + Vite + TS)
│   ├── .agent/         # Hướng dẫn chi tiết dành cho AI Agent & Developers
│   ├── dist/           # Bundle tĩnh sau khi build production
│   └── src/            # Components, Pages, Services, Contexts
│
└── DEPLOYMENT.md       # Hướng dẫn triển khai Production (IIS, PM2, NSSM)
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Backend
* **Runtime & Language:** Node.js (CommonJS), TypeScript (Strict Mode)
* **Framework:** Express 4
* **Database:** PostgreSQL (kết nối qua `pg.Pool` & giao dịch qua Transaction wrapper)
* **Cache & Realtime:** Redis (`ioredis`) & Socket.IO (Redis adapter để scale ngang)
* **Authentication:** Passport.js (Local & JWT với cơ chế xoay vòng refresh token)
* **Process Manager:** PM2 (Cluster Mode) / NSSM (chạy Windows Service)

### Frontend
* **Core Framework:** React 18 (Vite 4)
* **Styling:** Tailwind CSS 3, Lucide React (Icons)
* **Routing:** React Router DOM 6
* **State Management:** React Context (Auth) & Zustand 5 (Global states)
* **HTTP Client:** Axios Instance (đã cấu hình tự động gắn token và xử lý lỗi tập trung)

---

## 📋 Yêu Cầu Hệ Thống (Prerequisites)

Trước khi chạy dự án, hãy đảm bảo hệ thống của bạn đã cài đặt:
* **Node.js** (Phiên bản 18 trở lên)
* **PostgreSQL** (Phiên bản 15 trở lên)
* **Redis** (Phiên bản 7 trở lên)
* *(Tùy chọn)* **Docker & Docker Compose** để chạy nhanh database và cache.

---

## 🚀 Hướng Dẫn Chạy Nhanh Ở Local (Quick Start)

### 1. Khởi chạy Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` dựa theo mẫu cấu hình trong file [README của Backend](file:///c:/WorkFolder/recruitment_system/backend/README.md#L62-L94).
4. Khởi tạo Database:
   ```bash
   npm run init-db
   npm run run-init-db
   ```
5. Chạy server ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   *Server backend mặc định chạy tại: http://localhost:3000*

### 2. Khởi chạy Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env` chứa địa chỉ API của Backend:
   ```ini
   VITE_API_URL=http://localhost:3000
   ```
4. Khởi chạy ứng dụng:
   ```bash
   npm run dev
   ```
   *Ứng dụng frontend mặc định chạy tại: http://localhost:5173*

---

## 🚢 Triển Khai Lên Server (Production)

Để triển khai hệ thống lên server Windows Production (sử dụng IIS để host Frontend, PM2/NSSM để chạy và quản lý Backend), vui lòng tham khảo tài liệu hướng dẫn từng bước tại:
👉 **[Hướng dẫn Triển khai Hệ thống (DEPLOYMENT.md)](file:///c:/WorkFolder/recruitment_system/DEPLOYMENT.md)**

---

## 📚 Tài Liệu Hướng Dẫn Phát Triển (Dành cho Developer & AI Agent)

Hệ thống có các quy tắc viết code rất nghiêm ngặt (kiểm tra kiểu dữ liệu, chống lặp code, bảo mật dữ liệu nhạy cảm, bọc transaction). Vui lòng đọc kỹ các tài liệu hướng dẫn tương ứng trước khi sửa đổi hoặc thêm tính năng:

* **Hướng dẫn phát triển Backend:** [backend/.agent/guide.md](file:///c:/WorkFolder/recruitment_system/backend/.agent/guide.md)
* **Hướng dẫn viết và chạy Test Backend:** [backend/.agent/testGuide.md](file:///c:/WorkFolder/recruitment_system/backend/.agent/testGuide.md)
* **Hướng dẫn phát triển Frontend:** [frontend/.agent/guide.md](file:///c:/WorkFolder/recruitment_system/frontend/.agent/guide.md)
