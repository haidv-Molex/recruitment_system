# Recruitment System — Dockerized Deployment & Backup Guide

Tài liệu này hướng dẫn cách chạy dự án **Recruitment System** (bao gồm cả Frontend, Backend, PostgreSQL và Redis) bằng Docker / Docker Compose, cùng với quy trình sao lưu (backup) và khôi phục (restore) dữ liệu dự án.

---

## 📌 Kiến trúc hệ thống trong Docker

Hệ thống bao gồm 4 container chính chạy trong cùng một mạng ảo (bridge network):

1. **`db` (PostgreSQL 15)**: Lưu trữ cơ sở dữ liệu hệ thống. Tự động khởi tạo schema khi khởi chạy lần đầu thông qua thư mục `./backend/init-db`.
2. **`redis` (Redis 7)**: Sử dụng làm cache dữ liệu và lưu trữ phiên đăng nhập (session).
3. **`backend` (NodeJS/Express/TypeScript)**: Cung cấp RESTful API cho client. Sử dụng PM2 Cluster Mode để tối ưu hóa hiệu năng container.
4. **`frontend` (React/Vite served via Nginx)**: Chứa giao diện người dùng SPA, chạy bằng Nginx để phân phối static files và xử lý routing của React Router.

---

## 🛠️ Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (bao gồm cả Docker Compose).

---

## ⚙️ Cấu hình Biến Môi Trường (Environment Variables)

Hệ thống sử dụng tệp tin `.env` ở thư mục gốc để quản lý cấu hình cho tất cả các dịch vụ.

1. **Sao chép tệp mẫu**:
   ```bash
   cp .env.example .env
   ```

2. **Cấu hình các tham số quan trọng trong `.env`**:
   - `POSTGRES_PASSWORD` và `PG_PASSWORD`: Đặt mật khẩu an toàn cho PostgreSQL.
   - `REDIS_PASSWORD`: Đặt mật khẩu cho Redis.
   - `SECRET_AUTH_TOKEN_KEY`: Đặt khóa bảo mật ký token JWT.
   - `VITE_API_URL`: URL mà trình duyệt client sẽ gọi đến Backend (mặc định là `http://localhost:3000`).
   - `FRONTEND_PORT`: Cổng hiển thị của Frontend trên máy Host (mặc định là `80`).
   - `BACKUP_DIR`: Đường dẫn thư mục lưu trữ các file sao lưu (Ví dụ: `./backups` hoặc một đường dẫn tuyệt đối bất kỳ ngoài thư mục dự án).

---

## 🚀 Khởi chạy dự án với Docker Compose

### 1. Khởi động hệ thống
Di chuyển tới thư mục gốc của dự án và khởi chạy lệnh sau:
```bash
docker compose up -d --build
```
Lệnh này sẽ:
- Build Dockerfile của Frontend và Backend.
- Tải các image PostgreSQL và Redis nhẹ (Alpine).
- Tạo các volume để duy trì dữ liệu PostgreSQL (`pgdata`) và Redis (`redisdata`).
- Khởi động các container dưới dạng chạy ngầm (`-d`).

### 2. Truy cập ứng dụng
Sau khi các dịch vụ khởi chạy hoàn tất:
- **Frontend (Giao diện người dùng)**: [http://localhost](http://localhost) (Hoặc cổng bạn đã cấu hình tại `FRONTEND_PORT`).
- **Backend APIs**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

### 3. Kiểm tra Logs hệ thống
```bash
# Kiểm tra log của toàn bộ hệ thống
docker compose logs -f

# Chỉ kiểm tra log của Backend
docker compose logs -f backend

# Chỉ kiểm tra log của Database
docker compose logs -f db
```

### 4. Dừng và dọn dẹp tài nguyên
```bash
# Dừng các container
docker compose down

# Dừng và xóa toàn bộ dữ liệu database/cache (Cẩn thận: Lệnh này xóa các volumes lưu trữ)
docker compose down -v
```

---

## 💾 Quy trình Sao lưu & Khôi phục (Backup & Restore)

### 1. Sao lưu tự động bằng Script

Dự án hỗ trợ script sao lưu tự động cho cả Linux/macOS và Windows. Script tự động đọc đường dẫn thư mục backup (`BACKUP_DIR`) từ file `.env` (mặc định là thư mục `./backups` trong dự án). Các bản sao lưu cũ quá 7 ngày sẽ tự động được dọn dẹp.

#### 🐧 Trên Linux / macOS (Bash Script)
**Cách chạy trực tiếp**:
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

**Cấu hình tự động hàng ngày (Cron)**:
Để tự động chạy sao lưu vào lúc 2:00 AM hàng ngày:
```bash
crontab -e
```
Thêm dòng sau vào cấu hình cron:
```text
0 2 * * * /path/to/project/scripts/backup.sh >> /path/to/project/backups/backup.log 2>&1
```

#### 🪟 Trên Windows (PowerShell Script)
**Cách chạy trực tiếp**:
1. Mở PowerShell với quyền Administrator.
2. Cho phép chạy file script nội bộ nếu cần:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope Process
   ```
3. Khởi chạy script backup:
   ```powershell
   .\scripts\backup.ps1
   ```

**Cấu hình tự động hàng ngày (Windows Task Scheduler)**:
1. Mở **Task Scheduler**.
2. Chọn **Create Basic Task...**, đặt tên (ví dụ: `RecruitmentSystemBackup`).
3. Chọn Trigger là **Daily**, đặt thời gian chạy mong muốn.
4. Chọn Action là **Start a program**.
5. Trong trường *Program/script*, nhập: `powershell.exe`.
6. Trong trường *Add arguments (optional)*, nhập: `-ExecutionPolicy Bypass -File "C:\path\to\your\project\scripts\backup.ps1"`.
7. Nhấp **Finish** để lưu.

---

### 2. Sao lưu thủ công (Manual Backup)

#### A. Sao lưu Cơ sở dữ liệu (PostgreSQL)
Lệnh sau sẽ xuất toàn bộ dữ liệu ra tệp tin `.sql` từ container đang chạy:
```bash
docker exec -t recruitment_db pg_dump -U postgres recruitment_db > db_backup.sql
```
*Lưu ý: Sử dụng `-t` thay vì `-it` để tránh lỗi "the input device is not a TTY" khi chạy tự động bằng cron.*

#### B. Sao lưu tệp tin đã tải lên (Uploads Folder)
Mọi file CV, JD hoặc tài liệu ứng viên tải lên được lưu trong thư mục `backend/uploads` trên máy host thông qua Docker mount volume. Bạn có thể nén để lưu trữ:
```bash
tar -czf uploads_backup.tar.gz backend/uploads
```

---

### 3. Khôi phục dữ liệu (Restore)

#### A. Khôi phục Cơ sở dữ liệu (PostgreSQL)
Để khôi phục dữ liệu từ tệp sao lưu `.sql` vào container database:
```bash
# Bước 1: (Tùy chọn) Xóa dữ liệu cũ nếu muốn làm sạch database trước khi restore
docker exec -i recruitment_db psql -U postgres -d recruitment_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Bước 2: Khôi phục dữ liệu từ file backup
docker exec -i recruitment_db psql -U postgres -d recruitment_db < db_backup.sql
```

#### B. Khôi phục thư mục Uploads
Giải nén tệp sao lưu uploads đè lại vào thư mục ban đầu:
```bash
tar -xzf uploads_backup.tar.gz
```

---

## 📝 Các lệnh Docker hữu dụng khi vận hành

- **Khởi động lại một service cụ thể sau khi sửa code (ví dụ backend)**:
  ```bash
  docker compose restart backend
  ```
- **Build lại mà không sử dụng cache**:
  ```bash
  docker compose build --no-cache
  ```
- **Kiểm tra dung lượng ổ đĩa của các container và volumes**:
  ```bash
  docker system df
  ```
