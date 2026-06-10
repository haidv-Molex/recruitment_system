# Hướng dẫn viết Test cho Agent

> Đọc toàn bộ file này trước khi bắt đầu viết bất kỳ test nào.

---

## 1. Nguyên tắc bất biến

- **Một file source → một file test**
- **Cấu trúc thư mục test phải mirror 100% cấu trúc source**
- **Không test facade class** (`_User.ts`, `_Candidate.ts`, ...) — chúng chỉ là aggregation, không có logic
- **Dùng DB thật — nhưng TUYỆT ĐỐI KHÔNG để lại dữ liệu sau khi test**
- **Mọi test có DB phải dùng transaction + ROLLBACK trong `afterEach`**
- **TUYỆT ĐỐI KHÔNG ĐỂ LẠI FILE RÁC sau khi test. Các file tạm tạo ra phải được xoá trong `afterEach`.**
- **Nếu cần tạo file để test hoặc tạo thử nghiệm, BẮT BUỘC tạo bên trong thư mục `.test/` và phải có lệnh xoá đệ quy thư mục này (`fs.rmSync(".test", { recursive: true, force: true })`) khi test kết thúc.**
- **Sau mỗi file test tạo xong → chạy test ngay → cập nhật `task.md` và `issues.md`**
- **Mỗi lần chạy agent, đọc `task.md` trước → bỏ qua những file đã `[x]` hoặc `[!]`**

> **Tại sao dùng DB thật?** Service functions nhận `PoolClient` làm tham số — truyền client thật từ DB để test đúng behavior thực tế, bao gồm cả các DB constraint (VARCHAR length, UNIQUE, NOT NULL...).
>
> **Tại sao ROLLBACK?** Để DB luôn ở trạng thái sạch sau mỗi test. Không để lại rác, không ảnh hưởng test khác, không cần seed/cleanup.

---

## 2. Cấu trúc thư mục

```
Source:  /WorkFolder/recruitment_system/backend/services/user/findById.ts
Test:    /WorkFolder/recruitment_system/backend/test/services/user/findById.test.ts

Source:  /WorkFolder/recruitment_system/backend/utilities/validateEnv.ts
Test:    /WorkFolder/recruitment_system/backend/test/utilities/validateEnv.test.ts

Source:  /WorkFolder/recruitment_system/backend/services/candidate/create.ts
Test:    /WorkFolder/recruitment_system/backend/test/services/candidate/create.test.ts
```

---

## 3. Stack & Setup

### Dependencies
- **Mocha** — test runner (`ts-mocha` để load TypeScript)
- **Chai** (`expect`) — assertions
- **Sinon** — stub cho external dependency **không phải DB** (redis, fs, external API)
- **`pg`** — real PoolClient, lấy từ `@middlewares/database`

### Yêu cầu môi trường
- DB PostgreSQL phải **đang chạy** khi test
- Dùng đúng file `.env` (hoặc tạo `.env.test` riêng nếu có DB test)
- DB phải có đủ schema (chạy `npm run init-db` và import nếu cần)

### Không dùng
- ❌ Sinon stub cho `pool.query` — dùng pool thật
- ❌ `withTransaction()` trong test — tự quản lý transaction để có thể ROLLBACK
- ❌ `redis` thật — stub redis bằng Sinon nếu hàm dùng Redis
- ❌ `fs.writeFile` thật — stub fs nếu hàm ghi file (để test không tạo file rác)

### Chạy test
```bash
# Toàn bộ
npm run test

# Một file cụ thể
npm run test:file 'test/services/user/createUser.test.ts'

# Hoặc trực tiếp
node_modules/.bin/ts-mocha -p tsconfig.json --paths --timeout 30000 --exit 'test/path/to/file.test.ts'
```

> **Lưu ý:** Project dùng **ts-mocha** vì Mocha v11 hardcode ESM loader cho `.ts`. `ts-mocha` dùng `ts-node` + `tsconfig-paths` để load TypeScript + resolve alias đúng cách.

---

## 4. Pattern cốt lõi: Transaction + Rollback

**Đây là pattern BẮT BUỘC cho mọi test có tương tác DB:**

```typescript
import { pool } from "@middlewares/database";
import { PoolClient } from "pg";

describe("someService", () => {
  let client: PoolClient;

  // Trước mỗi test: lấy connection + BEGIN transaction
  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
  });

  // Sau mỗi test: ROLLBACK → DB sạch như chưa có gì xảy ra
  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("test nào đó", async () => {
    // Truyền client thật vào service — mọi thay đổi nằm trong transaction
    const result = await myService(params, client);
    expect(result).to.xxx;
    // afterEach sẽ ROLLBACK → không có gì được commit vào DB
  });
});
```

**Tại sao không dùng `withTransaction()`?**
`withTransaction()` tự COMMIT sau khi callback xong — không thể ROLLBACK để dọn dẹp. Test phải tự quản lý transaction.

---

## 5. Template đầy đủ: Service có DB

```typescript
import { expect } from "chai";
import sinon from "sinon";
import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";

// ✅ Import trực tiếp service function, KHÔNG qua facade (_User.ts, _Candidate.ts,...)
import create from "@services/user/create";

describe("createUser", () => {
  let client: PoolClient;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
  });

  afterEach(async () => {
    await client.query("ROLLBACK"); // ← Xóa sạch mọi thay đổi
    client.release();
    sinon.restore();
  });

  // ✅ Happy path — INSERT thật, nhưng bị ROLLBACK sau test
  it("should return userModel with correct fields", async () => {
    const result = await create({ username: "john_doe" }, client);

    expect(result).to.have.property("user_id").that.is.a("number");
    expect(result.user_name).to.equal("john_doe");
  });

  // 🔲 Edge case: tên quá dài — DB sẽ throw vì VARCHAR(255)
  it("should throw when name exceeds VARCHAR(255) limit", async () => {
    const longName = "A".repeat(256);

    try {
      await create({ username: longName }, client);
      expect.fail("Should have thrown DB error");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
    }
  });

  // ❌ AppError 500 khi INSERT không trả về row — test bằng cách stub pool.query CHỈ trong case này
  it("should throw AppError 500 when INSERT returns no row", async () => {
    const originalQuery = client.query.bind(client);
    sinon.stub(client, "query").callsFake(async (...args: any[]) => {
      if (typeof args[0] === "string" && args[0].includes("INSERT")) {
        return { rows: [], rowCount: 0 } as any;
      }
      return originalQuery(...args);
    });

    try {
      await create({ username: "ghost_user" }, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(500);
    }
  });
});
```

---

## 6. Template: Service chỉ SELECT (không thay đổi data)

Dùng `beforeEach` để INSERT seed data trong transaction — sẽ bị ROLLBACK sau test:

```typescript
import findById from "@services/user/findById";

describe("findUserById", () => {
  let client: PoolClient;
  let seededUserId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Tạo seed data trong transaction — sẽ bị ROLLBACK sau test
    const res = await client.query(
      `INSERT INTO "user" (user_name) VALUES ($1) RETURNING user_id`,
      ["Test User"]
    );
    seededUserId = res.rows[0].user_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK"); // seed data cũng bị xóa
    client.release();
  });

  it("should return user when found", async () => {
    const result = await findById(seededUserId, client);
    expect(result.user_name).to.equal("Test User");
  });

  it("should throw AppError 404 when not found", async () => {
    try {
      await findById(999999, client); // id không tồn tại
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
    }
  });
});
```

---

## 7. Template: Service có Redis (stub Redis, dùng DB thật)

Redis không nằm trong transaction nên phải stub:

```typescript
import sinon from "sinon";
import redis from "@middlewares/redisClient";

describe("serviceWithRedis", () => {
  let client: PoolClient;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Stub toàn bộ redis operations
    sinon.stub(redis, "get").resolves(null);
    sinon.stub(redis, "set").resolves("OK");
    sinon.stub(redis, "del").resolves(1);
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
    sinon.restore(); // restore redis stubs
  });
});
```

---

## 8. Template: Utility (không có DB, không cần transaction)

```typescript
import { expect } from "chai";
import validateEnv from "@utilities/validateEnv";

describe("validateEnv", () => {
  it("should not throw when required env variables are present", () => {
    // config mock env if needed...
    expect(() => validateEnv()).to.not.throw();
  });
});
```

---

## 9. Góc độ test cần cover (mỗi hàm)

| Góc độ | Mô tả | Áp dụng cho |
|---|---|---|
| ✅ **Happy path** | Input hợp lệ → trả về đúng kết quả | Tất cả |
| ❌ **Not found** | SELECT không có row → throw AppError(404) | Service có SELECT |
| ❌ **DB constraint** | Vượt VARCHAR limit, UNIQUE violation... → DB throw | Service có INSERT/UPDATE |
| ❌ **Invalid input** | null, undefined, id âm | Tất cả |
| 🔲 **Edge case** | Chuỗi rỗng, unicode, số âm, mảng rỗng | Tùy hàm |
| 🔲 **Boundary** | Page = 0, id = 0, giới hạn VARCHAR | Hàm có pagination/id |
| 🔄 **Seed + Query** | INSERT seed trong transaction rồi SELECT | Hàm SELECT cần data |

---

## 10. Quy trình làm việc của agent

```
1. Đọc task.md → tìm item [ ] đầu tiên
2. Đọc source file tương ứng để hiểu:
   - Hàm nhận tham số gì
   - Gọi pool.query mấy lần, với SQL nào
   - Throw AppError khi nào, statusCode bao nhiêu
   - Có dùng Redis / fs / service khác không (cần stub)
3. Đọc file schema .sql tương ứng trong model/ để biết:
   - Tên bảng, tên cột
   - Kiểu dữ liệu và constraint (VARCHAR, NOT NULL, UNIQUE...)
   - Dùng constraint đó để viết test edge case đúng
4. Tạo file test tại đúng đường dẫn mirror
5. Viết test với pattern BEGIN/ROLLBACK
6. Chạy: npm run test:file 'test/services/user/createUser.test.ts'
7. PASS → đánh dấu [x] trong task.md → sang item tiếp theo
8. FAIL → đánh dấu [!] trong task.md → append vào .agent/issues.md → sang item tiếp theo
```

---

## 11. Đọc Schema SQL trước khi viết test

Trước khi viết test cho một service, **bắt buộc đọc schema tương ứng**:

```
services/user/create.ts
  → đọc model/user/user_schema.sql
  → biết: user_name VARCHAR(255) → test với 256 ký tự sẽ fail
```

Dùng thông tin schema để xác định:
- Giá trị hợp lệ / không hợp lệ
- Các constraint cần test (VARCHAR length, UNIQUE, FK...)
- Tên bảng và cột chính xác khi cần INSERT seed data

---

## 12. Format ghi `issues.md` khi test fail

```markdown
## [FAIL] services/user/findById.test.ts
**Date**: 2026-06-09
**Error**:
\`\`\`
AssertionError: expected null to be instanceOf AppError
    at Context.<anonymous> (test/services/user/findById.test.ts:32:5)
\`\`\`
**Root cause**: Hàm return `null` thay vì throw AppError(404) khi không tìm thấy
**Action needed**: Người dùng cần sửa service để throw AppError(404) thay vì return null
```

---

## 13. Thứ tự ưu tiên viết test

Từ ít dependency → nhiều dependency:

1. `utilities/` — pure functions, không cần DB
2. `services/department/`
3. `services/job/`
4. `services/user/`
5. `services/candidate/`