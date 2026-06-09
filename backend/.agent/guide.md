# Recruitment System Backend – Agent Reference Guide

> Tài liệu này dành cho AI Agent. Đọc toàn bộ trước khi bắt đầu thực hiện bất kỳ task nào.

---

## 1. Tổng quan dự án

**Recruitment System Backend** là REST API backend cho hệ thống quản lý tuyển dụng.

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express 4
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (pg Pool)
- **Cache / Session**: Redis (ioredis)
- **Realtime**: Socket.IO (với Redis adapter cho cluster)
- **Auth**: Passport.js (Local, JWT, Custom strategies)
- **Validation**: Joi
- **File Upload**: Multer
- **Process Manager**: PM2 (cluster mode)
- **Logging**: Winston
- **Testing**: Mocha + Chai + Pactum

---

## 2. Cấu trúc thư mục chi tiết

```
recruitment_system/
├── index.ts                    # Entry point duy nhất
├── serverConfig.ts             # Express setup, CORS, Rate limiter, Redis IO adapter
├── ecosystem.config.cjs        # PM2 config
│
├── controller/                 # Tầng controller – chỉ chứa Express Router
│   ├── _*Controller.ts         # Router tổng hợp (ví dụ: _UserController.ts)
│   ├── auth/                   # Endpoints xác thực và tài khoản
│   ├── candidate/              # Endpoints quản lý ứng viên
│   ├── department/             # Endpoints quản lý phòng ban
│   ├── job/                    # Endpoints quản lý công việc (Jobs)
│   └── user/                   # Endpoints quản lý người dùng / hệ thống
│
├── services/                   # Tầng business logic
│   ├── candidate/
│   │   └── _Candidate.ts       # Facade class export tất cả methods của Candidate
│   ├── department/
│   │   └── _Department.ts      # Facade class export tất cả methods của Department
│   ├── job/
│   │   └── _Job.ts             # Facade class export tất cả methods của Job
│   └── user/
│       └── _User.ts            # Facade class export tất cả methods của User
│
├── model/                      # TypeScript types + SQL schema files
│   ├── candidate/
│   │   ├── candidateModel.ts   # candidate type definition
│   │   └── candidate_schema.sql
│   ├── department/
│   │   ├── departmentModel.ts  # department type definition
│   │   └── department_schema.sql
│   ├── job/
│   │   ├── jobModel.ts         # job type definition
│   │   └── job_schema.sql
│   ├── user/
│   │   ├── userModel.ts        # user type definition
│   │   └── user_schema.sql
│   └── config/                 # DB configuration & helpers (e.g. update_updated_at_column.sql)
│
├── middlewares/                # Express middlewares
│   ├── AppError.ts             # class AppError extends Error
│   ├── globalErrorHandler.ts   # 4-type error handler
│   ├── passport.ts             # Tất cả Passport strategies
│   ├── database.ts             # pg.Client + pg.Pool
│   ├── redisClient.ts          # ioredis + setCache/getCache/delCache helpers
│   ├── withTransaction.ts      # DB transaction wrapper
│   ├── joiValidate.ts          # Joi middleware factory
│   ├── validateFileQuality.ts  # Sharp (image) + ffprobe (audio) validation
│   └── logger.ts               # Winston instance
│
├── utilities/                  # Pure utility functions (no Express)
│   ├── validateEnv.ts
│   └── generate-init-sql.ts
│
├── types/
│   └── express.d.ts            # Mở rộng Express.Request
│
└── test/                       # Mocha tests
```

---

## 3. Path Aliases (tsconfig.json)

Tất cả import phải dùng alias thay vì đường dẫn tương đối:

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

## 4. Conventions & Coding Patterns

### 4.1 Controller Pattern

Mỗi controller là một file riêng biệt, export một `express.Router()`.

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
    passport.authenticate('jwt', { session: false }), // Nếu cần auth
    joiValidate(joiSchema, 'body'),
    joiValidate(joiQuery, 'query'),
    async (req, res) => {
        const result = await withTransaction(async (pool) => {
            return await User.someMethod(req.body, pool);
        });

        res.status(200).json({
            result: true,
            message: "Mô tả kết quả",
            data: result
        });
    }
);

export default userController;
```

**Quy tắc bắt buộc:**
- Luôn dùng `withTransaction()` bọc mọi query DB
- Validate bằng `joiValidate` trước khi vào handler
- Response format: `{ result: boolean, message: string, data?: any }`
- Không bao giờ viết SQL thẳng trong controller
- Nếu route cần auth: `passport.authenticate('jwt', { session: false })`
- Nếu route cần admin/check role: kiểm tra phân quyền bằng cách kiểm tra `req.user?.user_role` trong handler hoặc service.

### 4.2 Service Pattern

Service là pure function nhận `PoolClient` làm tham số cuối, không biết về Express.

```typescript
import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { userModel } from "@model/user/userModel";

type Props = {
    username: string;
};

async function myServiceFunction(props: Props, pool: PoolClient): Promise<userModel> {
    const query = `SELECT * FROM "user" WHERE user_name = $1`;
    const result = await pool.query(query, [props.username]);

    if (result.rows.length === 0) {
        throw new AppError("Not found", 404);
    }

    return result.rows[0] as userModel;
}

export default myServiceFunction;
```

**Quy tắc:**
- Không import Express trong service
- Tham số cuối luôn là `pool: PoolClient`
- Throw `AppError` thay vì return null/undefined khi có lỗi
- Dùng TypeScript types từ `@model/...`
- Dùng parameterized query (`$1`, `$2`, ...) để tránh SQL injection

### 4.3 Facade Class Pattern

Mỗi domain có một `_ClassName.ts` tổng hợp các method:

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

Controller luôn gọi qua facade: `User.create(...)`, `User.findById(...)`, không import trực tiếp service function.

### 4.4 Model (TypeScript Types)

Types không phải class, chỉ là TypeScript `type` hoặc `interface`:

```typescript
// model/user/userModel.ts
export type userModel = {
  user_id: number;
  user_name: string;
  user_account: string | null;
  user_password: string | null;
  user_description: string | null;
  user_role: string | null;
  create_at: Date;
  update_at: Date;
  department_id: number | null;
}
```

---

## 5. Error Handling

### AppError
```typescript
throw new AppError("Không tìm thấy", 404);          // operational error
throw new AppError("Lỗi server", 500, true);         // 3rd param: isOperational
```

Không cần try/catch trong controller vì `express-async-errors` đã handle async errors tự động. Chỉ cần `next(error)` hoặc `throw`.

### Global Error Handler (`globalErrorHandler.ts`)
4 loại lỗi được xử lý:
1. `AppError` → trả về statusCode và message gốc
2. `DatabaseError` (pg code 22xx/23xx) → 500 + generic message
3. Mail errors (`EAUTH`, `ESOCKET`, ...) → 500 + "Không thể gửi mail"
4. Unknown → 500 + generic message

### Response Format chuẩn
```json
// Thành công
{ "result": true, "message": "...", "data": {} }

// Thành công (có phân trang)
// QUAN TRỌNG: pagination phải nằm ngoài data
{ 
  "result": true, 
  "message": "Lấy danh sách thành công", 
  "data": [...], 
  "pagination": { "current_page": 1, "total_pages": 10, "total_items": 100 } 
}

// Lỗi
{ "result": false, "message": "...", "type": "AppError|DatabaseError|..." }

// Validation lỗi  
{ "result": false, "message": "Dữ liệu không hợp lệ", "details": ["field là bắt buộc"] }
```

---

## 6. Authentication Flow

### Login (Local)
```
POST /auth/login
→ passport.authenticate('login')
→ Verify account + password
→ Generate accessToken (JWT, 15m) + refreshToken (JWT, 30d)
→ refreshToken → Redis (key: refreshToken:{user_id}:{jti})
→ refreshToken → httpOnly cookie
→ Response: { ...user, accessToken }
```

### Request Auth
```
Header: Authorization: Bearer <accessToken>
→ passport.authenticate('jwt')
→ Kiểm tra blacklist Redis
→ Verify JWT → set req.user
```

### Rate Limiting
- 100 requests/phút mặc định (configure qua env)
- Login fail counter: Redis key `login_fail:{user_id}`, khóa 15 phút sau 5 lần sai

---

## 7. Database

### PostgreSQL Pool
```typescript
// Luôn dùng withTransaction
const result = await withTransaction(async (pool) => {
    return await pool.query("SELECT ...", [param1, param2]);
});
```

Pool config: max 20 connections, idleTimeout 30s, connectionTimeout 2s.

### Redis Cache Pattern
```typescript
import { setCache, getCache, delCache } from "@middlewares/redisClient";

// Đặt cache
await setCache(`user:${id}`, data, 3600); // TTL tính bằng giây

// Lấy cache
const cached = await getCache<UserType>(`user:${id}`);
if (cached) return cached;

// Xóa cache khi update
await delCache(`user:${id}`);
```

---

## 8. File Upload (Multer)

Upload đi qua multer config tại `utilities/multer/`. Sau upload, `validateFileQuality` middleware kiểm tra định dạng và chất lượng tệp tin (ví dụ: kích thước tối đa của tài liệu ứng viên là 5MB).

---

## 9. Data Models Examples

### User Model
```typescript
export type userModel = {
  user_id: number;
  user_name: string;
  user_account: string | null;
  user_password: string | null;
  user_description: string | null;
  user_role: string | null;
  create_at: Date;
  update_at: Date;
  department_id: number | null;
}
```

### Candidate Model
```typescript
export type candidateModel = {
  candidate_id: number;
  candidate_code: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  agency: string | null;
  offer_date: Date;
  onboard_date: Date;
  feedback_date: Date;
  current_salary: string;
  expected_salary: string;
  status: string;
  note: string;
  create_at: Date;
  update_at: Date;
  source: number;
  recruiter: number;
  job_id: number;
  targeted_company: number | null;
  reference: number | null;
  file_id: number | null;
}
```

---

## 10. Quy tắc khi viết code mới

### Tạo endpoint mới (ví dụ: GET /user/someFeature)

1. **Tạo service function** tại `services/user/someFeature.ts`:
   ```typescript
   async function someFeature(param: string, pool: PoolClient): Promise<SomeType> {
       const result = await pool.query(`SELECT ...`, [param]);
       if (!result.rows[0]) throw new AppError("Not found", 404);
       return result.rows[0] as SomeType;
   }
   export default someFeature;
   ```

2. **Thêm vào facade** `services/user/_User.ts`:
   ```typescript
   import someFeature from "@services/user/someFeature";
   // trong class User:
   static someFeature = someFeature;
   ```

3. **Tạo controller** `controller/user/someFeatureController.ts`:
   ```typescript
   const router = express.Router();
   router.get("", joiValidate(schema, 'query'), async (req, res) => {
       const result = await withTransaction(pool => User.someFeature(req.query.param, pool));
       res.status(200).json({ result: true, message: "...", data: result });
   });
   export default router;
   ```

4. **Mount trong router** `controller/user/_UserController.ts`:
   ```typescript
   import someFeatureController from "@controller/user/someFeatureController";
   UserController.use("/someFeature", someFeatureController);
   ```

### Đặt tên file
- Controller: `camelCase` + `Controller.ts` (vd: `advancedSearchUserController.ts`)
- Service: `camelCase` chức năng (vd: `advancedSearch.ts`, `findById.ts`)
- Facade: `_ClassName.ts` (vd: `_User.ts`, `_Candidate.ts`)
- Model types: `camelCase` + `Model.ts` (vd: `userModel.ts`)

---

## 11. Kiểm tra khi có lỗi

1. **401/403**: Kiểm tra JWT token còn hạn, không bị blacklist
2. **400 validation**: Kiểm tra Joi schema khớp với request
3. **500 DB error**: Kiểm tra pg Pool connection, query syntax
4. **Redis error**: Kiểm tra REDIS_HOST/PORT/PASSWORD trong .env
5. **File upload lỗi**: Kiểm tra multer fieldname khớp với `validateFileQuality`

---

## 12. Không làm những điều này

- ❌ Không viết SQL trực tiếp trong controller
- ❌ Không import Express trong service
- ❌ Không dùng đường dẫn tương đối (`../../`) trong import
- ❌ Không query DB mà không dùng `withTransaction()`
- ❌ Không return `null` trong service khi có lỗi → dùng `throw new AppError()`
- ❌ Không bỏ qua Joi validation cho input từ user
- ❌ Không hardcode credential hay secret trong code