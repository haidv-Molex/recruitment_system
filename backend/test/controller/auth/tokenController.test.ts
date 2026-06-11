// Thiết lập biến môi trường trước khi load bất kỳ module nào
process.env.SECRET_AUTH_TOKEN_KEY = "recruitment_system";
process.env.EXPIRES_TOKEN = "15m";
process.env.EXPIRES_REFRESH_TOKEN = "30d";

import "express-async-errors";
import sinon from "sinon";
import passport from "@middlewares/passport";
import { pool } from "@middlewares/database";
import redis from "@middlewares/redisClient";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";
import express from "express";
import pactum from "pactum";
import tokenController from "@controller/auth/tokenController";
import assert from "assert";
import jwt from "jsonwebtoken";

describe("tokenController API", () => {
  let poolConnectStub: sinon.SinonStub;
  let findByIdStub: sinon.SinonStub;
  let redisGetStub: sinon.SinonStub;
  let redisSetStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;

  const secretOrKey = "recruitment_system";

  before(async () => {
    // Thiết lập Express App
    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/auth/token", tokenController);
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

    // Stub User service
    findByIdStub = sinon.stub(User, "findById");

    // Stub Redis operations
    redisGetStub = sinon.stub(redis, "get").resolves(null);
    redisSetStub = sinon.stub(redis, "set").resolves("OK");
  });

  afterEach(() => {
    poolConnectStub.restore();
    findByIdStub.restore();
    redisGetStub.restore();
    redisSetStub.restore();
  });

  after((done) => {
    server.close(done);
  });

  it("should return 200 and a new access token when correct refreshToken is provided via body", async () => {
    const mockUser = {
      user_id: 1,
      user_name: "John Doe",
      user_account: "john_doe",
      user_role: "hr"
    };

    const tokenPayload = { user_id: 1, jti: "test-jti-123" };
    const validRefreshToken = jwt.sign(tokenPayload, secretOrKey, { expiresIn: "30d" });

    // Mock Redis returning the valid refresh token (JSON formatted as in setCache)
    redisGetStub.withArgs("refreshToken:1:test-jti-123").resolves(JSON.stringify(validRefreshToken));
    findByIdStub.resolves(mockUser);

    const response = await pactum.spec()
      .post("/auth/token")
      .withJson({
        refreshToken: validRefreshToken
      })
      .expectStatus(200)
      .expectJsonLike({
        result: true,
        message: "Cấp lại access token thành công"
      });

    assert.ok(response.body.data.accessToken, "Response should have an accessToken");
    assert.strictEqual(typeof response.body.data.accessToken, "string", "accessToken should be a string");
    assert.strictEqual(findByIdStub.calledOnce, true);
  });

  it("should return 200 and a new access token when correct refreshToken is provided via header", async () => {
    const mockUser = {
      user_id: 1,
      user_name: "John Doe",
      user_account: "john_doe",
      user_role: "hr"
    };

    const tokenPayload = { user_id: 1, jti: "test-jti-123" };
    const validRefreshToken = jwt.sign(tokenPayload, secretOrKey, { expiresIn: "30d" });

    redisGetStub.withArgs("refreshToken:1:test-jti-123").resolves(JSON.stringify(validRefreshToken));
    findByIdStub.resolves(mockUser);

    const response = await pactum.spec()
      .post("/auth/token")
      .withHeaders("x-refresh-token", validRefreshToken)
      .expectStatus(200)
      .expectJsonLike({
        result: true,
        message: "Cấp lại access token thành công"
      });

    assert.ok(response.body.data.accessToken, "Response should have an accessToken");
    assert.strictEqual(typeof response.body.data.accessToken, "string", "accessToken should be a string");
  });

  it("should return 401 when no refresh token is provided", async () => {
    await pactum.spec()
      .post("/auth/token")
      .expectStatus(401)
      .expectJson({
        result: false,
        message: "không tìm thấy refreshToken, vui lòng đăng nhập",
        type: "AppError"
      });
  });

  it("should return 403 when refresh token is invalid", async () => {
    await pactum.spec()
      .post("/auth/token")
      .withJson({
        refreshToken: "invalid-token"
      })
      .expectStatus(403)
      .expectJson({
        result: false,
        message: "Refresh token không hợp lệ hoặc đã hết hạn.",
        type: "AppError"
      });
  });

  it("should return 403 when refresh token does not match Redis key", async () => {
    const tokenPayload = { user_id: 1, jti: "test-jti-123" };
    const validRefreshToken = jwt.sign(tokenPayload, secretOrKey, { expiresIn: "30d" });

    // Redis returns null (e.g. token expired or revoked)
    redisGetStub.withArgs("refreshToken:1:test-jti-123").resolves(null);

    await pactum.spec()
      .post("/auth/token")
      .withJson({
        refreshToken: validRefreshToken
      })
      .expectStatus(403)
      .expectJson({
        result: false,
        message: "Refresh token không khớp hoặc đã bị thu hồi.",
        type: "AppError"
      });
  });
});
