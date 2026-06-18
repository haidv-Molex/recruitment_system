# Recruitment System Backend – Agent Reference Guide

> Tài liệu này dành cho AI Agent. Đọc toàn bộ trước khi bắt đầu thực hiện bất kỳ task nào.

---

## 1. Tổng quan dự án

**Recruitment System Backend** là hệ thống REST API phục vụ cho ứng dụng tuyển dụng.
- **Runtime**: Node.js (CommonJS - `"type": "commonjs"`)
- **Framework**: Express 4
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (pg Pool & PoolClient)
- **Cache / Session**: Redis (ioredis)
- **Realtime**: Socket.IO (với Redis adapter để scale ngang)
- **Auth**: Passport.js (Local, JWT, Custom strategies)
- **Validation**: Joi
- **File Upload**: Multer + custom quality & type check middleware
- **Process Manager**: PM2 (cluster mode)
- **Logging**: Winston
- **Testing**: Mocha + Chai + Sinon + Pactum

---

## 2. Cấu trúc thư mục chi tiết

Dự án tuân theo cấu trúc phân lớp rõ ràng:

```
recruitment_system/backend/
├── index.ts                    # Entry point khởi tạo server & graceful shutdown
├── serverConfig.ts             # Cấu hình Express, CORS, Helmet, Rate limiter, Socket.io & Redis Adapter
├── ecosystem.config.cjs        # Cấu hình PM2 Cluster
│
├── controller/                 # Tầng Controller (Chỉ chứa Express Router và Middleware)
│   ├── _*Controller.ts         # Controller tổng hợp (Facade Router) import các file controller chi tiết
│   ├── auth/                   # API xác thực, đăng ký, đăng nhập, refresh token, logout
│   ├── candidate/              # APIs quản lý ứng viên (Create, Read, Update, Delete)
│   ├── company/                # APIs quản lý công ty đối tác
│   ├── department/             # APIs quản lý phòng ban tuyển dụng
│   ├── file/                   # APIs xử lý tải và đọc tệp tin
│   ├── job/                    # APIs quản lý tin tuyển dụng (Jobs)
│   ├── level/                  # APIs quản lý cấp bậc vị trí
│   ├── platform/               # APIs quản lý nền tảng tuyển dụng
│   ├── segment/                # APIs quản lý phân khúc/bộ phận tuyển dụng
│   ├── site/                   # APIs quản lý địa điểm làm việc (Site)
│   └── dashboard/              # APIs Dashboard — chỉ dùng để trả dữ liệu chart
│
├── services/                   # Tầng Business Logic (Không chứa Express request/response)
│   ├── _ClassName.ts           # Facade class tổng hợp tất cả methods của domain (ví dụ: _User.ts)
│   ├── candidate/              # Các hàm logic của ứng viên (create, update, delete, getById, v.v.)
│   ├── company/                # Logic cho công ty
│   ├── department/             # Logic cho phòng ban
│   ├── file/                   # Logic xử lý file upload/download
│   ├── job/                    # Logic cho tin tuyển dụng
│   ├── level/                  # Logic cho cấp bậc
│   ├── platform/               # Logic cho nền tảng
│   ├── segment/                # Logic cho phân khúc
│   ├── site/                   # Logic cho địa điểm
│   ├── user/                   # Logic quản lý tài khoản & phân quyền
│   └── dashboard/              # Logic tổng hợp dữ liệu chart cho Dashboard
│
├── model/                      # Định nghĩa TypeScript Types & SQL Schema files
│   ├── candidate/              # Types & Schema cho ứng viên
│   ├── company/                # Types & Schema cho công ty
│   ├── department/             # Types & Schema cho phòng ban
│   ├── file/                   # Types & Schema cho file
│   ├── job/                    # Types & Schema cho công việc
│   ├── level/                  # Types & Schema cho cấp bậc
│   ├── platform/               # Types & Schema cho nền tảng
│   ├── segment/                # Types & Schema cho phân khúc
│   ├── site/                   # Types & Schema cho địa điểm
│   ├── user/                   # Types & Schema cho người dùng
│   ├── config/                 # SQL script dùng chung (ví dụ: update_updated_at_column.sql)
│   └── linking/                # Các bảng liên kết trung gian (n-n)
│       ├── candidate_level/
│       ├── employee_level/
│       ├── hiring_manager/
│       ├── job_business_partner/
│       ├── job_department/
│       ├── job_segment/
│       ├── job_site/
│       └── job_title/
│
├── middlewares/                # Express Middlewares dùng chung
│   ├── AppError.ts             # Định nghĩa lớp lỗi AppError extends Error
│   ├── database.ts             # Cấu hình PostgreSQL pg.Pool & xuất client
│   ├── globalErrorHandler.ts   # Middleware xử lý lỗi tập trung 4 tham số
│   ├── joiValidate.ts          # Factory validate input bằng Joi
│   ├── logger.ts               # Khởi tạo instance Winston
│   ├── passport.ts             # Định nghĩa các strategies Passport (jwt, local, google)
│   ├── redisClient.ts          # Kết nối Redis & helpers cache (getCache, setCache, delCache)
│   ├── socketErrorHandler.ts   # Xử lý lỗi Socket.IO
│   ├── validateFileQuality.ts  # Middleware xác thực định dạng và dung lượng file tải lên
│   └── withTransaction.ts      # Helper bọc thực thi SQL trong DB Transaction
│
├── utilities/                  # Hàm tiện ích thuần túy (Không dùng Express)
│   ├── file/                   # Tiện ích liên quan tới file (vd: tạo bảng dữ liệu)
│   ├── generate-init-sql.ts    # Gom và sắp xếp các file .sql theo thứ tự Foreign Key
│   ├── joiTypes.ts             # Kiểu Joi tùy biến
│   ├── jwtTimeToSeconds.ts     # Tiện ích đổi thời hạn JWT sang giây
│   ├── run-init-sql.ts         # Khởi tạo/Recreate cơ sở dữ liệu từ file SQL đã sắp xếp
│   └── validateEnv.ts          # Ràng buộc kiểm tra biến môi trường khi start
│
├── types/
│   ├── express.d.ts            # Mở rộng Express.Request (req.user, req.file, req.io, v.v.)
│   └── chart.d.ts              # Types dùng chung cho Dashboard APIs:
│                               #   ChartDateRange { from, to }
│                               #   ChartDataPoint { label, value }
│                               #   ChartResponse  { title, from, to, total, data[] }
│
└── test/                       # Thư mục chứa các file kiểm thử tự động (Mocha + Chai)
```

---

## 3. Path Aliases (tsconfig.json)

Tất cả import phải dùng alias đã cấu hình trong `tsconfig.json`. Tuyệt đối không dùng đường dẫn tương đối dài dòng (ví dụ: `../../`).

| Alias | Mapped to |
|---|---|
| `@/*` | `./*` (root) |
| `@controller/*` | `controller/*` |
| `@services/*` | `services/*` |
| `@model/*` | `model/*` |
| `@database/*` | `database/*` |
| `@middlewares/*` | `middlewares/*` |
| `@utilities/*` | `utilities/*` |
| `@type/*` | `types/*` |

**Ví dụ đúng:**
```typescript
import User from "@services/user/_User";
import { withTransaction } from "@middlewares/withTransaction";
import { AppError } from "@middlewares/AppError";
import type { userModel } from "@model/user/userModel";
```

---

## 4. Quy tắc & Mẫu thiết kế code chuẩn (Design Patterns)

### 4.1 Controller Pattern
Mỗi controller là một file Router Express xử lý một tính năng hoặc một tập hợp endpoint của domain. Mọi controller phải được import và mount vào Facade Router của domain đó (ví dụ: `_UserController.ts`).

```typescript
import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import User from "@services/user/_User";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const userController = express.Router();

// Joi schema cho body
const joiSchema = Joi.object({
    username: Joi.string().required(),
});

// Joi schema cho query (nếu cần)
const joiQuery = Joi.object({
    page: Joi.number().min(1).default(1).optional(),
});

userController.post("",
    passport.authenticate('jwt', { session: false }), // Nếu cần xác thực JWT
    joiValidate(joiSchema, 'body'),
    joiValidate(joiQuery, 'query'),
    async (req, res) => {
        // Thực thi business logic thông qua database transaction wrapper
        const result = await withTransaction(async (pool) => {
            return await User.someMethod(req.body, pool);
        });

        res.status(200).json({
            result: true,
            message: "Xử lý thành công",
            data: result
        });
    }
);

export default userController;
```

**Quy tắc bắt buộc:**
- Luôn bọc tất cả câu lệnh query/thao tác DB bằng `withTransaction(async (pool) => { ... })`.
- Kiểm tra hợp lệ dữ liệu bằng middleware `joiValidate` trước khi xử lý logic.
- Cấu trúc response mặc định: `{ result: boolean, message: string, data?: any, pagination?: any }`.
- **Cấm** viết SQL raw trực tiếp trong file Controller.
- Với routes cần xác thực: sử dụng `passport.authenticate('jwt', { session: false })`.
- Kiểm tra phân quyền dựa vào `req.user?.user_role` trong handler hoặc service.

### 4.2 Service Pattern
Service là tầng chứa logic nghiệp vụ thuần túy (pure functions). Hàm service nhận dữ liệu đầu vào và tham số cuối cùng bắt buộc là `PoolClient` (DB client trong transaction). Service không được phép biết về đối tượng Request/Response của Express.

```typescript
import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

type Props = {
    username: string;
};

async function myServiceFunction(props: Props, pool: PoolClient): Promise<userOutputModel> {
    const query = `
      SELECT user_id, user_name, user_description, user_role, department_id, create_at, update_at
      FROM "user" WHERE user_name = $1
    `;
    const result = await pool.query(query, [props.username]);

    if (result.rows.length === 0) {
        throw new AppError("Không tìm thấy người dùng", 404);
    }

    return {
        user_id: result.rows[0].user_id,
        user_name: result.rows[0].user_name,
        user_description: result.rows[0].user_description,
        user_role: result.rows[0].user_role,
        department_id: result.rows[0].department_id,
        create_at: result.rows[0].create_at,
        update_at: result.rows[0].update_at
    } satisfies userOutputModel;
}

export default myServiceFunction;
```

**Quy tắc:**
- Không import Express hoặc các đối tượng liên quan đến HTTP vào Service.
- Tham số cuối luôn là `pool: PoolClient`.
- Thay vì return `null`/`undefined` khi xảy ra lỗi nghiệp vụ, hãy throw `AppError` kèm HTTP status code thích hợp.
- Sử dụng parameterized query (`$1`, `$2`, ...) để phòng chống SQL Injection.
- **Cấm dùng `as Type` để ép kiểu dữ liệu trả về từ DB.** Phải map tường minh từng thuộc tính của object và sử dụng từ khóa `satisfies Type` của TypeScript để trình biên dịch kiểm tra tính hợp lệ của kiểu dữ liệu.
- Mọi câu lệnh SQL `SELECT` hoặc `RETURNING` khi truy vấn thông tin người dùng **chỉ được liệt kê tường minh các cột public**, cấm dùng `SELECT *` hoặc `RETURNING *`.
- Trước khi viết SQL, mapper hoặc logic nghiệp vụ mới, **bắt buộc tìm trong `services/`, `utilities/` và `model/` xem đã có hàm, type hoặc helper tương đương chưa**. Nếu đã có, phải tái sử dụng hoặc tách phần chung thành helper/service dùng chung thay vì viết lại.

### 4.3 Facade Class Pattern
Để tránh việc controller phải import trực tiếp hàng chục file service nhỏ lẻ, mỗi domain sẽ có một file Facade class đặt tên theo dạng `_ClassName.ts` (ví dụ: `_User.ts`) tổng hợp và export tất cả các service.

```typescript
// services/user/_User.ts
import create from "@services/user/create";
import findById from "@services/user/findById";

class User {
    static create = create;
    static findById = findById;
}
export default User;
```

Trong controller và service khác, hãy luôn gọi service thông qua Facade class: `User.create(...)`, `User.findById(...)`, `Department.getById(...)`. Cách này làm rõ logic đang truy cập domain/bảng nào, tránh tình trạng nhiều file cùng có `findById` nhưng callsite không biết thuộc domain nào.

**Quy tắc import service bắt buộc:**
- Khi một file cần dùng logic của domain khác, import Facade class của domain đó, ví dụ `import User from "@services/user/_User"`, rồi gọi `User.findById(...)`.
- Khi một service trong cùng domain cần dùng service khác của chính domain đó, vẫn ưu tiên gọi qua Facade class nếu không tạo vòng import runtime. Nếu Facade dùng import tĩnh và việc import ngược `_ClassName.ts` gây circular dependency, được phép import trực tiếp service cùng domain đó như ngoại lệ kỹ thuật có chủ đích.
- Không import trực tiếp service function như `import findById from "@services/user/findById"` trong code nghiệp vụ, ngoại trừ bên trong file Facade class hoặc trường hợp kỹ thuật bắt buộc đã được ghi rõ trong plan.
- Giữ Facade class gọn nhẹ bằng import tĩnh và static assignment (`static getById = getById`). Không dùng `typeof import(...)` hoặc dynamic `await import(...)` trong Facade chỉ để né vòng import; nếu vòng import thực sự xảy ra, tách helper hoặc điều chỉnh cấu trúc ownership cho rõ ràng.

### 4.4 Quy tắc chống lặp code (DRY)

Không được lặp lại logic đã tồn tại chỉ vì viết lại nhanh hơn. Code mới phải ưu tiên tái sử dụng service, helper, model type và mapper hiện có để giữ một nguồn sự thật duy nhất.

**Quy tắc bắt buộc:**
- Trước khi thêm service/query/mapper mới, dùng tìm kiếm trong repo để kiểm tra chức năng tương tự đã tồn tại chưa.
- Logic thuộc domain nào thì domain đó làm chủ. Service của domain khác khi cần dữ liệu này phải gọi Facade class của domain chủ sở hữu bằng cùng `PoolClient`, ví dụ `User.findById(userId, pool)` hoặc `Department.getById(departmentId, pool)`.
- Không copy lại danh sách cột public, object mapper, validation, cache key hoặc xử lý lỗi đã có ở service khác.
- Nếu cần thông tin user theo `user_id`, dùng Facade `User.findById(...)` cho trường hợp một user. Nếu cần lấy user cho danh sách nhiều bản ghi, dùng Facade service có sẵn như `User.getAll(...)` hoặc tạo service batch trong `services/user/` và gọi qua `User.findByIds(...)`; không tự lặp lại `SELECT` và mapping public user trong service domain khác như `services/department/getAll.ts`.
- Chỉ viết query custom có join sang domain khác khi thật sự cần để filter, sort hoặc aggregate ở cấp SQL. Khi query custom chỉ lấy id của domain khác, hãy dùng service của domain đó để dựng object trả về thay vì tự copy mapper của domain đó.

### 4.5 Model & Sensitive Data Protection
Tất cả các thực thể dữ liệu trong cơ sở dữ liệu đều có kiểu định nghĩa trong thư mục `model/`.
Đối với các bảng nhạy cảm như `user`, chúng ta định nghĩa hai loại model:

```typescript
// model/user/userModel.ts
export type userModel = {
  user_id: number;
  user_name: string;
  user_account: string | null;  // Thông tin đăng nhập nhạy cảm
  user_password: string | null; // Mật khẩu băm nhạy cảm
  user_description: string | null;
  user_role: string | null;
  create_at: Date;
  update_at: Date;
  department_id: number | null;
}

// Kiểu dữ liệu public an toàn cho client - Loại bỏ account và password
export type userOutputModel = Omit<userModel, 'user_password' | 'user_account'>;
```

**Quy tắc dữ liệu nhạy cảm:**
- Mọi service trả về thông tin user ra ngoài (cho controller và response API) **bắt buộc** dùng `userOutputModel`.
- Kiểu `userModel` (đầy đủ) chỉ được dùng nội bộ trong passport strategy khi cần xác thực mật khẩu (`bcrypt.compare`).
- Đối tượng `Express.User` (lưu trong `req.user`) cũng kế thừa từ `userOutputModel` (không chứa account/password).

---

## 5. Xử lý lỗi (Error Handling)

### AppError
Sử dụng `AppError` để ném ra các lỗi nghiệp vụ (operational errors).
```typescript
throw new AppError("Ứng viên không tồn tại", 404);
throw new AppError("Lỗi hệ thống", 500, true); // tham số thứ 3: isOperational (mặc định là true)
```

Nhờ thư viện `express-async-errors` được import tại `index.ts`, các hàm async trong Express router sẽ tự động chuyển lỗi ném ra tới global handler mà không cần bọc khối code trong `try/catch` thủ công ở controller.

### Global Error Handler (`globalErrorHandler.ts`)
Xử lý tập trung 4 nhóm lỗi chính:
1. `AppError`: Trả về đúng `statusCode` và `message` được định nghĩa.
2. `DatabaseError` (lỗi từ PostgreSQL, pg code `22xx`, `23xx`, v.v.): Trả về mã lỗi 500 và thông điệp lỗi chung chung nhằm bảo mật cấu trúc DB.
3. Lỗi gửi Mail (`EAUTH`, `ESOCKET`, ...): Trả về mã lỗi 500 kèm thông báo "Không thể gửi email".
4. Các lỗi không xác định khác: Log chi tiết ra hệ thống và trả về mã lỗi 500 kèm message generic.

### Chuẩn định dạng Response
```json
// Thành công thông thường
{ "result": true, "message": "Thành công", "data": {} }

// Thành công có phân trang (Pagination nằm ngoài trường data)
{ 
  "result": true, 
  "message": "Lấy danh sách thành công", 
  "data": [...], 
  "pagination": { "current_page": 1, "total_pages": 10, "total_items": 100 } 
}

// Thất bại do logic nghiệp vụ
{ "result": false, "message": "Thông báo lỗi chi tiết", "type": "AppError" }

// Thất bại do validate Joi đầu vào
{ "result": false, "message": "Dữ liệu không hợp lệ", "details": ["username là bắt buộc"] }
```

---

## 6. Luồng xác thực & Bảo mật (Authentication)

### Login (Local Strategy)
```
POST /auth/login
→ passport.authenticate('login')
→ Kiểm tra account + password
→ Tạo accessToken (JWT, thời hạn 15m) + refreshToken (JWT, thời hạn 30d)
→ Lưu refreshToken vào Redis (Key pattern: `refreshToken:{user_id}:{jti}`)
→ Ghi refreshToken vào httpOnly Cookie để bảo mật
→ Trả về JSON: { result: true, data: { ...userOutputModel, accessToken } }
```

### JWT Authenticated Requests
```
Header: Authorization: Bearer <accessToken>
→ passport.authenticate('jwt', { session: false })
→ Kiểm tra blacklist Token trên Redis
→ Xác thực chữ ký và thời hạn JWT
→ Gắn thông tin user vào req.user (kiểu userOutputModel)
```

### Rate Limiting & Login Brute Force Protection
- Mặc định giới hạn tối đa 100 requests/phút trên mỗi IP.
- Cơ chế khóa tài khoản đăng nhập sai: Lưu số lần đăng nhập sai vào Redis `login_fail:{user_id}`, tự động khóa đăng nhập trong 15 phút nếu nhập sai quá 5 lần liên tiếp.

---

## 7. Cơ sở dữ liệu & Cache

### PostgreSQL Pool
```typescript
const result = await withTransaction(async (pool) => {
    return await pool.query("SELECT ...", [param1, param2]);
});
```
Pool connection được cấu hình tại `middlewares/database.ts` (mặc định tối đa 20 connections, idleTimeout 30s, connectionTimeout 2s).

### Redis Cache Pattern
```typescript
import { setCache, getCache, delCache } from "@middlewares/redisClient";

// Ghi dữ liệu vào cache kèm thời gian sống (TTL - giây)
await setCache(`user:${id}`, data, 3600);

// Đọc dữ liệu từ cache
const cached = await getCache<UserType>(`user:${id}`);
if (cached) return cached;

// Xóa dữ liệu cache khi có sự thay đổi (Update/Delete)
await delCache(`user:${id}`);
```

---

## 8. Quy trình thêm endpoint mới (Ví dụ: GET /user/profile)

Để tạo một endpoint mới một cách chuẩn chỉ, agent cần tuân thủ 4 bước sau:

1. **Tạo service function** tại `services/user/profile.ts`:
   ```typescript
   import { PoolClient } from "pg";
   import { AppError } from "@middlewares/AppError";
   import type { userOutputModel } from "@model/user/userModel";

   async function profile(userId: number, pool: PoolClient): Promise<userOutputModel> {
       const result = await pool.query(
           `SELECT user_id, user_name, user_description, user_role, department_id, create_at, update_at
            FROM "user" WHERE user_id = $1`,
           [userId]
       );
       if (result.rows.length === 0) {
           throw new AppError("Người dùng không tồn tại", 404);
       }

       return {
           user_id: result.rows[0].user_id,
           user_name: result.rows[0].user_name,
           user_description: result.rows[0].user_description,
           user_role: result.rows[0].user_role,
           department_id: result.rows[0].department_id,
           create_at: result.rows[0].create_at,
           update_at: result.rows[0].update_at
       } satisfies userOutputModel;
   }
   export default profile;
   ```

2. **Thêm vào Facade class** tại `services/user/_User.ts`:
   ```typescript
   import profile from "@services/user/profile";
   
   class User {
       // ... methods khác
       static profile = profile;
   }
   export default User;
   ```

3. **Tạo router controller** tại `controller/user/profileController.ts`:
   ```typescript
   import express from "express";
   import { withTransaction } from "@middlewares/withTransaction";
   import User from "@services/user/_User";
   import passport from "@middlewares/passport";

   const router = express.Router();

   router.get("", 
       passport.authenticate('jwt', { session: false }), 
       async (req, res) => {
           const userId = req.user!.user_id;
           const result = await withTransaction(pool => User.profile(userId, pool));
           res.status(200).json({ result: true, message: "Lấy profile thành công", data: result });
       }
   );
   export default router;
   ```

4. **Mount router vào Controller chính** `controller/user/_UserController.ts`:
   ```typescript
   import profileController from "@controller/user/profileController";
   
   UserController.use("/profile", profileController);
   ```

### Quy tắc đặt tên File & Thư mục:
- Controllers: Dùng `camelCase` + suffix `Controller.ts` (ví dụ: `createCandidateController.ts`).
- Services: Dùng `camelCase` mô tả đúng chức năng (ví dụ: `create.ts`, `findById.ts`).
- Facade: Dùng `_ClassName.ts` (ví dụ: `_User.ts`, `_Candidate.ts`).
- Model Types: Dùng `camelCase` + suffix `Model.ts` (ví dụ: `candidateModel.ts`).

---

## 9. Khởi tạo Cơ sở dữ liệu

Khi có bất kỳ thay đổi nào liên quan tới file `.sql` trong thư mục `model/`:
1. Chạy lệnh gom schema và giải quyết khóa ngoại:
   ```bash
   npm run init-db
   ```
2. Chạy cập nhật database local:
   ```bash
   npm run run-init-db
   ```

---

## 10. Viết Test & Đảm bảo chất lượng code

AI Agent **bắt buộc** phải đọc tài liệu hướng dẫn viết test tại [.agent/testGuide.md](file:///c:/WorkFolder/recruitment_system/backend/.agent/testGuide.md) trước khi bắt đầu tạo test.

**Tóm tắt nguyên tắc viết test:**
- Một file source logic/service → một file test tương ứng tại cùng cấu trúc thư mục trong `test/`.
- Sử dụng DB thật để chạy test nhưng luôn bọc trong transaction `BEGIN` & `ROLLBACK` ở `beforeEach` và `afterEach`.
- Stub các tài nguyên ngoài (Redis, File System, Mail) bằng Sinon.
- Chạy kiểm thử cụ thể: `npm run test:file 'test/services/user/create.test.ts'`.

---

## 11. Tuyệt đối KHÔNG làm những điều sau (Cấm)

- ❌ Không viết SQL trực tiếp ở tầng Controller.
- ❌ Không import các module của Express (`Request`, `Response`) vào tầng Service.
- ❌ Không dùng đường dẫn tương đối để import module → Sử dụng alias `@/`.
- ❌ Không thực hiện query DB mà không dùng helper `withTransaction()`.
- ❌ Không return `null` / `undefined` trong Service khi có lỗi nghiệp vụ → Luôn dùng `throw new AppError()`.
- ❌ Không bỏ qua việc validate Joi cho dữ liệu nhận từ người dùng ở Controller.
- ❌ Không hardcode credential, token hay config nhạy cảm vào code → Sử dụng `process.env`.
- ❌ Không ép kiểu bằng `as Type` cho kết quả truy vấn từ DB → Dùng ánh xạ tường minh và `satisfies`.
- ❌ Không trả về kiểu `userModel` (chứa password/account) ra client → Luôn dùng `userOutputModel`.
- ❌ Không dùng `SELECT *` hoặc `RETURNING *` khi truy cập bảng `user` → Liệt kê chi tiết cột public.
- ❌ Không lặp lại SQL, mapper, validation, cache key hoặc xử lý lỗi đã có ở service/helper khác → Tái sử dụng logic hiện có hoặc tách phần chung trước khi viết code mới.
- ❌ Không import trực tiếp service function kiểu `findById`, `getById`, `create` từ domain khác hoặc từ cùng domain trong code nghiệp vụ → Gọi qua Facade class như `User.findById(...)`, `Department.getById(...)` để callsite luôn rõ domain.

---

## 12. Dashboard APIs — Quy tắc & Mẫu thiết kế

### 12.1 Nguyên tắc chung

- **Input bắt buộc**: Mọi Dashboard API đều nhận `from` và `to` (query string dạng ISO date `YYYY-MM-DD`) làm khoảng thời gian lọc dữ liệu.
- **`from` & `to` là tuỳ chọn**: Nếu không truyền → không lọc theo ngày, trả toàn bộ dữ liệu. Nếu có → lọc theo khoảng thời gian đó.
- **Output chuẩn**: Service trả về `ChartDataPoint[]` — **chỉ `{ label, value }`**. Không có `title`, `total`, `from`, `to` trong data. FE tự tính toán và render.
- **Mount point**: Tất cả Dashboard API được mount tại `/dashboard` trong `index.ts`.
- **Auth**: Tất cả Dashboard API đều yêu cầu JWT (`passport.authenticate('jwt', { session: false })`).

### 12.2 Cấu trúc types (`types/chart.d.ts`)

```typescript
/** Khoảng thời gian đầu vào — cả hai đều optional. Không truyền = không lọc theo ngày */
export type ChartDateRange = { from?: Date; to?: Date; };

/** Dữ liệu chart — BE chỉ trả { label, value }[], FE tự tính total và render */
export type ChartDataPoint = { label: string; value: number; };
```

> **Quy tắc:**
> - Không thêm field `color`, `total`, `title`, `from`, `to` hay bất kỳ thông tin giao diện nào vào service.
> - Không định nghĩa `ChartResponse` hay bất kỳ wrapper type nào — service luôn trả `ChartDataPoint[]` thẳng.

### 12.3 Quy trình thêm Dashboard API mới

**Bước 1 — Tạo service** tại `services/dashboard/<chartName>.ts`:
```typescript
import { PoolClient } from "pg";
import type { ChartDateRange, ChartDataPoint } from "@type/chart.d";

async function myChartService(range: ChartDateRange, pool: PoolClient): Promise<ChartDataPoint[]> {
  const hasDateFilter = range.from !== undefined && range.to !== undefined;
  const query = hasDateFilter
    ? `SELECT ... AS label, ... AS value FROM ... WHERE date >= $1 AND date <= $2 ORDER BY value DESC`
    : `SELECT ... AS label, ... AS value FROM ... ORDER BY value DESC`;
  const params = hasDateFilter ? [range.from, range.to] : [];
  const result = await pool.query(query, params);
  return result.rows.map(row => ({ label: row.label as string, value: row.value as number }));
}
export default myChartService;
```

**Bước 2 — Đăng ký vào Facade** tại `services/dashboard/_Dashboard.ts`:
```typescript
import myChartService from "./myChartService";
class Dashboard {
  static hcRequestedByDepartment = hcRequestedByDepartment;
  static myChart = myChartService; // ← thêm vào đây
}
export default Dashboard;
```

**Bước 3 — Tạo controller** tại `controller/dashboard/<chartName>Controller.ts`:
```typescript
import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import Dashboard from "@services/dashboard/_Dashboard";
import { withTransaction } from "@middlewares/withTransaction";

const router = express.Router();
const joiQuery = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref("from")).optional(),
});

router.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(joiQuery, "query"),
  async (req, res) => {
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to   = req.query.to   ? new Date(req.query.to   as string) : undefined;
    const data = await withTransaction(pool => Dashboard.myChart({ from, to }, pool));
    res.status(200).json({ result: true, message: "Thành công", data });
  }
);
export default router;
```

**Bước 4 — Mount vào Facade Controller** tại `controller/dashboard/_DashboardController.ts`:
```typescript
import myChartController from "./myChartController";
DashboardController.use("/my-chart", myChartController); // → GET /dashboard/my-chart
```

### 12.4 Danh sách Dashboard APIs hiện có

| Endpoint | Service | Mô tả |
|---|---|---|
| `GET /dashboard/hc-by-department` | `hcRequestedByDepartment` | Tổng HC yêu cầu theo phòng ban (bar chart) |
| `GET /dashboard/hc-by-status-month` | `hcByStatusAndExpectedOnboardMonth` | Số lượng HC theo status và expected onboard month (lọc status bắt buộc) |
| `GET /dashboard/hc-by-recruiter` | `hcByRecruiter` | Số lượng candidate tuyển được theo từng recruiter (lọc job_id, department_id tùy chọn) |
| `GET /dashboard/hc-by-hrbp` | `hcRequestedByHrbp` | Tổng HC yêu cầu theo từng HRBP (lọc job_id, department_id tùy chọn) |
| `GET /dashboard/hc-by-hiring-manager` | `hcRequestedByHiringManager` | Tổng HC yêu cầu theo từng Hiring Manager (lọc job_id, department_id tùy chọn) |
| `GET /dashboard/hc-by-month` | `hcRequestedByMonth` | Tổng HC yêu cầu theo từng tháng dựa vào request_date (lọc department_id tùy chọn) |
| `GET /dashboard/job-hc-tracking` | `jobHCTracking` | Theo dõi headcount chi tiết cho từng job: required, closed, open (lọc department_id tùy chọn) |