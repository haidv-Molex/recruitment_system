// Thiết lập biến môi trường trước khi load bất kỳ module nào
process.env.SECRET_AUTH_TOKEN_KEY = "recruitment_system";
process.env.EXPIRES_TOKEN = "15m";
process.env.EXPIRES_REFRESH_TOKEN = "30d";

import "express-async-errors";
import sinon from "sinon";
import passport from "@middlewares/passport";
import { pool } from "@middlewares/database";
import redis from "@middlewares/redisClient";
import User from "@services/user/User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";
import express from "express";
import pactum from "pactum";
import loginController from "@controller/auth/loginController";
import { AppError } from "@middlewares/AppError";
import assert from "assert";

describe("loginController API", () => {
  let poolConnectStub: sinon.SinonStub;
  let findByAccountStub: sinon.SinonStub;
  let comparePasswordStub: sinon.SinonStub;
  let isAdminStub: sinon.SinonStub;
  let redisGetStub: sinon.SinonStub;
  let redisSetStub: sinon.SinonStub;
  let redisDelStub: sinon.SinonStub;
  let redisIncrStub: sinon.SinonStub;
  let redisExpireStub: sinon.SinonStub;
  let redisTtlStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;

  before(async () => {
    // Thiết lập Express App thực tế
    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/auth/login", loginController);
    app.use(globalErrorHandler);

    // Lắng nghe trên cổng ngẫu nhiên
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address: any = server.address();
        port = address.port;
        pactum.request.setBaseUrl(`http://127.0.0.1:${port}`);
        resolve();
      });
    });
  });

  beforeEach(() => {
    mockClient = {
      query: sinon.stub().resolves({ rows: [], rowCount: 0 }),
      release: sinon.stub()
    };
    poolConnectStub = sinon.stub(pool, "connect").resolves(mockClient);

    // Stub các dịch vụ User
    findByAccountStub = sinon.stub(User, "findByAccount");
    comparePasswordStub = sinon.stub(User, "comparePassword");
    isAdminStub = sinon.stub(User, "isAdmin");

    // Stub các hoạt động Redis
    redisGetStub = sinon.stub(redis, "get").resolves(null);
    redisSetStub = sinon.stub(redis, "set").resolves("OK");
    redisDelStub = sinon.stub(redis, "del").resolves(1);
    redisIncrStub = sinon.stub(redis, "incr").resolves(1);
    redisExpireStub = sinon.stub(redis, "expire").resolves(1);
    redisTtlStub = sinon.stub(redis, "ttl").resolves(900);
  });

  afterEach(() => {
    poolConnectStub.restore();
    findByAccountStub.restore();
    comparePasswordStub.restore();
    isAdminStub.restore();
    redisGetStub.restore();
    redisSetStub.restore();
    redisDelStub.restore();
    redisIncrStub.restore();
    redisExpireStub.restore();
    redisTtlStub.restore();
  });

  after((done) => {
    server.close(done);
  });

  it("should return 200 and access token when login details are correct", async () => {
    const mockUser = {
      user_id: 1,
      user_name: "John Doe",
      user_account: "john_doe",
      user_role: "hr"
    };

    findByAccountStub.resolves(mockUser);
    comparePasswordStub.resolves(true);
    isAdminStub.resolves(false);

    await pactum.spec()
      .post("/auth/login")
      .withJson({
        account: "john_doe",
        password: "password123"
      })
      .expectStatus(200)
      .expectJsonLike({
        result: true,
        message: "Đăng nhập thành công",
        data: {
          user_id: 1,
          user_name: "John Doe",
          user_account: "john_doe",
          user_role: "user"
        }
      });

    assert.strictEqual(findByAccountStub.calledOnce, true);
    assert.strictEqual(comparePasswordStub.calledOnce, true);
  });

  it("should return 401 when password is incorrect", async () => {
    const mockUser = {
      user_id: 1,
      user_name: "John Doe",
      user_account: "john_doe",
      user_role: "hr"
    };

    findByAccountStub.resolves(mockUser);
    comparePasswordStub.resolves(false); // Sai mật khẩu

    await pactum.spec()
      .post("/auth/login")
      .withJson({
        account: "john_doe",
        password: "wrong_password"
      })
      .expectStatus(401)
      .expectJson({
        result: false,
        message: "Sai mật khẩu"
      });

    assert.strictEqual(findByAccountStub.calledOnce, true);
    assert.strictEqual(comparePasswordStub.calledOnce, true);
  });

  it("should return 401 when account is not found", async () => {
    findByAccountStub.rejects(new AppError("Tài khoản hoặc mật khẩu không chính xác", 401));

    await pactum.spec()
      .post("/auth/login")
      .withJson({
        account: "unknown_user",
        password: "password123"
      })
      .expectStatus(401)
      .expectJson({
        result: false,
        message: "Tài khoản hoặc mật khẩu không chính xác"
      });

    assert.strictEqual(findByAccountStub.calledOnce, true);
    assert.strictEqual(comparePasswordStub.called, false);
  });

  it("should return 423 when user account is locked due to multiple login failures", async () => {
    const mockUser = {
      user_id: 1,
      user_name: "Locked User",
      user_account: "locked_user",
      user_role: "hr"
    };

    findByAccountStub.resolves(mockUser);
    // Giả lập Redis trả về số lần sai >= 5 (đã bị khóa)
    redisGetStub.resolves("5");
    redisTtlStub.resolves(900); // 15 phút

    await pactum.spec()
      .post("/auth/login")
      .withJson({
        account: "locked_user",
        password: "password123"
      })
      .expectStatus(423)
      .expectJson({
        result: false,
        message: "Tài khoản bị khóa. Thử lại sau 900 giây."
      });

    assert.strictEqual(findByAccountStub.calledOnce, true);
    assert.strictEqual(comparePasswordStub.called, false);
  });

  it("should return 400 validation error if account is missing", async () => {
    await pactum.spec()
      .post("/auth/login")
      .withJson({
        password: "password123"
      })
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Tài khoản đăng nhập là bắt buộc"]
      });
  });

  it("should return 400 validation error if password is empty", async () => {
    await pactum.spec()
      .post("/auth/login")
      .withJson({
        account: "user123",
        password: ""
      })
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Mật khẩu không được để trống"]
      });
  });
});
