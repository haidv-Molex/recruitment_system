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

## 📦 Quy trình Đóng gói & Deploy Ngoại tuyến (Offline / Air-gapped Deployment)

Khi triển khai trên máy chủ (server) không có kết nối Internet (môi trường air-gapped) hoặc không được phép tải tài nguyên trực tiếp từ Docker Hub / npm registry, bạn có thể build và đóng gói toàn bộ ứng dụng thành các file lưu trữ `.tar` ở máy cục bộ (có mạng), sau đó sao chép lên máy chủ để chạy.

### 1. Thực hiện đóng gói ở máy có kết nối Internet (Local Machine)

1. Cấu hình biến môi trường và build các Docker images:
   ```bash
   docker compose build
   ```
2. Đóng gói toàn bộ các Docker images cần thiết (bao gồm cả image ứng dụng và image cơ sở dữ liệu/cache gốc) thành một file nén `.tar` duy nhất:
   ```bash
   docker save -o recruitment_system_images.tar \
     recruitment_frontend:latest \
     recruitment_backend:latest \
     postgres:15-alpine \
     redis:7-alpine
   ```
   *(Lệnh này sẽ tạo ra tệp tin `recruitment_system_images.tar` chứa đầy đủ 4 images cần thiết cho dự án).*

### 2. Chuyển giao tài nguyên lên máy chủ (Production Server)

Sao chép các file sau từ máy cục bộ lên thư mục triển khai trên máy chủ:
1. Tệp tin nén chứa các images: `recruitment_system_images.tar`
2. File cấu hình Docker: `docker-compose.yml`
3. File cấu hình môi trường: `.env`
4. Thư mục khởi tạo database (nếu chạy lần đầu): `backend/init-db/`

### 3. Khởi chạy trên máy chủ (Production Server - Offline)

Di chuyển vào thư mục chứa các file vừa upload trên máy chủ và thực hiện:

1. Nạp (load) các Docker images từ file `.tar` vào Docker daemon của máy chủ:
   ```bash
   docker load -i recruitment_system_images.tar
   ```
2. Khởi chạy dự án bằng Docker Compose (không build lại và không cần tải gì thêm):
   ```bash
   docker compose up -d
   ```
   *(Hệ thống sẽ tự động sử dụng các images đã được nạp ở Bước 1 để khởi chạy các dịch vụ một cách offline hoàn toàn).*

### 💡 (Tùy chọn) Hướng dẫn đóng gói gộp Frontend và Backend vào một Image duy nhất

Nếu chính sách bảo mật máy chủ của bạn giới hạn nghiêm ngặt và chỉ cho phép chạy **duy nhất một Container** ứng dụng (không muốn chạy cụm Frontend & Backend riêng lẻ):

1. **Build tĩnh Frontend:** Chạy build ở thư mục `frontend` để tạo ra thư mục code tĩnh `/dist`.
2. **Copy file tĩnh vào Backend:** Tạo thư mục `backend/public` và sao chép toàn bộ nội dung từ `frontend/dist` vào thư mục này.
3. **Cấu hình Express phục vụ Frontend:** Thêm đoạn mã sau vào cuối file cấu hình Express của Backend (trước global error handler):
   ```typescript
   // Phục vụ các file tĩnh của Frontend
   app.use(express.static(path.join(__dirname, 'public')));

   // Trỏ mọi route không khớp (React Router) về index.html
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'index.html'));
   });
   ```
4. **Đóng gói & Export:** Lúc này bạn chỉ cần build duy nhất một Dockerfile của `backend` và sử dụng `docker save` để đóng gói duy nhất image đó mang lên server chạy.

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
