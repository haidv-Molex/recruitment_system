# Hướng Dẫn Triển Khai Hệ Thống (Deployment Guide)

Tài liệu này hướng dẫn chi tiết cách triển khai cả hai phần **Backend** và **Frontend** của dự án Recruitment System lên môi trường Production (Server chạy hệ điều hành Windows).

---

## I. TRIỂN KHAI BACKEND

### Bước 1: Build và chuẩn bị tại Local
Tại thư mục `backend` ở máy local của bạn, mở terminal và chạy lần lượt hai lệnh sau:
1. Gom các file SQL schema để chuẩn bị cho cơ sở dữ liệu:
   ```bash
   npm run init-db
   ```
2. Biên dịch code TypeScript sang JavaScript:
   ```bash
   npm run build
   ```
   *Lệnh này sẽ tạo ra thư mục `dist/` chứa mã nguồn đã biên dịch.*

### Bước 2: Sao chép các tệp tin lên Server
Sao chép các thư mục và file sau đây từ local và dán vào thư mục triển khai backend trên server (ví dụ: `C:\inetpub\wwwroot\recruitment_system\backend`):
* `dist/` (Thư mục chứa code JS sau khi build)
* `init-db/` (Thư mục chứa schema database đã gom)
* `node_modules/` (Thư mục dependencies)
* `.env` (File cấu hình môi trường chạy trên server)
* `package.json`
* `package-lock.json`
* `ecosystem.config.cjs` (File cấu hình chạy PM2)

> [!NOTE]
> Hãy chắc chắn cập nhật các thông số kết nối Database, Redis, Port, v.v., trong file `.env` trên Server sao cho đúng với môi trường thực tế.

### Bước 3: Khởi tạo/Cập nhật Database trên Server
Mở terminal (CMD/PowerShell) trên Server tại thư mục backend và chạy lệnh sau để thiết lập/tạo lại database:
```bash
npm run run-init-db
```

---

### Bước 4: Chạy Server (Sử dụng PM2 hoặc Windows Service)

Bạn có thể lựa chọn 1 trong 2 phương án dưới đây để khởi chạy backend:

#### PHƯƠNG ÁN A: Quản lý bằng PM2 (Khuyên dùng khi cần quản lý log và cluster)
* **Khởi động server:**
  ```bash
  npx pm2 start ecosystem.config.cjs
  ```
  *(Lệnh này sẽ chạy server dưới dạng background process theo cấu hình cluster mode trong `ecosystem.config.cjs`)*

* **Tắt/Dừng server:**
  Khi sử dụng PM2, bạn có các lệnh dừng/xóa tiến trình như sau:
  - **Dừng tạm thời tiến trình (Server tạm ngưng nhận request nhưng tiến trình vẫn nằm trong danh sách quản lý):**
    ```bash
    npx pm2 stop recruitment-system-server
    ```
    *(Hoặc chạy lệnh `npx pm2 stop ecosystem.config.cjs`)*
  - **Dừng và Xóa hẳn tiến trình ra khỏi danh sách quản lý của PM2:**
    ```bash
    npx pm2 delete recruitment-system-server
    ```
  - **Tắt và dọn dẹp sạch toàn bộ tiến trình PM2 đang chạy ngầm:**
    ```bash
    npx pm2 kill
    ```
  - **Xem danh sách và trạng thái các app đang chạy:**
    ```bash
    npx pm2 status
    ```
    *(Hoặc `npx pm2 list`)*
  - **Xem log thời gian thực:**
    ```bash
    npx pm2 logs
    ```

#### PHƯƠNG ÁN B: Chạy dưới dạng Windows Service (Sử dụng NSSM)
Nếu muốn server tự khởi động cùng Windows mà không cần chạy PM2 thủ công:
1. Tải công cụ **NSSM** (Non-Sucking Service Manager) về server.
2. Mở **PowerShell / CMD** bằng quyền Administrator.
3. Di chuyển CLI tới thư mục chứa file `nssm.exe` và chạy lệnh cài đặt:
   ```powershell
   ./nssm install test
   ```
   *(Bạn có thể đổi `test` thành tên service mong muốn, ví dụ: `recruitment-service`)*

4. Một bảng giao diện đồ họa (GUI) của NSSM sẽ hiện ra. Hãy điền các thông tin như sau:
   * **Path**: Trỏ tới file chạy của Node.js trên server.
     - *Ví dụ:* `C:\Program Files\nodejs\node.exe` (Bạn có thể chạy lệnh `where.exe node` trên CMD để tìm đường dẫn chính xác).
   * **Startup directory**: Trỏ đến thư mục gốc của Backend trên server (nơi chứa thư mục `dist` và `node_modules`).
     - *Ví dụ:* `C:\inetpub\wwwroot\recruitment_system\backend`
   * **Arguments**: Trỏ đến file khởi chạy chính nằm trong thư mục build:
     - Điền vào: `dist/index.js` (hoặc `./dist/index.js`)

5. Nhấn nút **Install service** để tạo Service.
6. Mở **Services** của Windows (`services.msc`), tìm service vừa tạo (ví dụ: `test` hoặc `recruitment-service`), chuột phải và chọn **Start** (và chuyển Startup type thành *Automatic* để tự khởi động khi reset server).

---

## II. TRIỂN KHAI FRONTEND

### Bước 1: Build ở Local
Tại thư mục `frontend` trên máy local, chạy lệnh sau:
```bash
npm run build
```
*Lệnh này sử dụng Vite để tối ưu hóa và build toàn bộ code frontend thành các file tĩnh HTML/JS/CSS nằm trong thư mục `dist/`.*

### Bước 2: Sao chép thư mục `dist` lên Server
Copy toàn bộ thư mục `dist/` (hoặc đổi tên thành `frontend-dist/` tùy ý) lên Server.

### Bước 3: Cấu hình IIS (Internet Information Services) để host Frontend
1. Mở công cụ quản lý **Internet Information Services (IIS) Manager** trên Server.
2. Tại cột bên trái, nhấn chuột phải vào mục **Sites** -> Chọn **Add Website...**.
3. Cấu hình các thông tin cơ bản:
   * **Site name**: Đặt tên gợi nhớ (ví dụ: `recruitment-frontend`).
   * **Physical path**: Chọn đường dẫn trực tiếp tới thư mục `dist/` của Frontend bạn vừa copy lên.
   * **Binding**: Chọn IP thích hợp, Port mong muốn (ví dụ: `80` hoặc `8080`) và nhập **Host name** (nếu có domain).
4. Nhấn **OK** để tạo và khởi chạy Website.

> [!IMPORTANT]
> **Cấu hình bổ sung cho React Router (Single Page Application - SPA):**
> 
> Vì ứng dụng React sử dụng Client-side routing, khi người dùng reload trang ở các đường dẫn con (ví dụ: `/candidates`), IIS sẽ trả về lỗi **404 Not Found**. Để khắc phục:
> 1. Tải và cài đặt module **URL Rewrite** cho IIS từ trang chủ Microsoft.
> 2. Tạo một file tên là `web.config` nằm bên trong thư mục `dist/` của frontend với nội dung dưới đây:
> 
> ```xml
> <?xml version="1.0" encoding="utf-8"?>
> <configuration>
>   <system.webServer>
>     <rewrite>
>       <rules>
>         <rule name="React Routes" stopProcessing="true">
>           <match url=".*" />
>           <conditions logicalGrouping="MatchAll">
>             <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
>             <add input="{REQUEST_DIRNAME}" matchType="IsDirectory" negate="true" />
>           </conditions>
>           <action type="Rewrite" url="/index.html" />
>         </rule>
>       </rules>
>     </rewrite>
>   </system.webServer>
> </configuration>
> ```
