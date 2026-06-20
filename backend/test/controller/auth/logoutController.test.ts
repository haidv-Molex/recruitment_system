// Thiết lập biến môi trường trước khi load bất kỳ module nào
process.env.SECRET_AUTH_TOKEN_KEY = "recruitment_system";
process.env.EXPIRES_TOKEN = "15m";
process.env.EXPIRES_REFRESH_TOKEN = "30d";

import "express-async-errors";
import sinon from "sinon";
import passport from "@middlewares/passport";
import redis from "@middlewares/redisClient";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";
import express from "express";
import pactum from "pactum";
import logoutController from "@controller/auth/logoutController";
import assert from "assert";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

describe("logoutController API", () => {
  let redisSetStub: sinon.SinonStub;
  let redisDelStub: sinon.SinonStub;
  let server: any;
  let port: number;

  const secretOrKey = "recruitment_system";

  before(async () => {
    // Thiết lập Express App
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(passport.initialize());
    app.use("/auth/logout", logoutController);
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
    // Stub Redis operations
    redisSetStub = sinon.stub(redis, "set").resolves("OK");
    redisDelStub = sinon.stub(redis, "del").resolves(1);
  });

  afterEach(() => {
    redisSetStub.restore();
    redisDelStub.restore();
  });

  after((done) => {
    server.close(done);
  });

  it("should return 200, blacklist tokens, clear redis key, and clear cookie when logging out with valid tokens", async () => {
    const accessTokenPayload = { user_id: 1, name: "John Doe" };
    const mockAccessToken = jwt.sign(accessTokenPayload, secretOrKey, { expiresIn: "15m" });

    const refreshTokenPayload = { user_id: 1, jti: "test-jti-123" };
    const mockRefreshToken = jwt.sign(refreshTokenPayload, secretOrKey, { expiresIn: "30d" });

    const response = await pactum.spec()
      .post("/auth/logout")
      .withHeaders("Authorization", `Bearer ${mockAccessToken}`)
      .withCookies("refreshToken", mockRefreshToken)
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Đăng xuất thành công"
      });

    // Check that cookies were cleared (express sets set-cookie header with expired date)
    const setCookie = response.headers["set-cookie"];
    assert.ok(setCookie, "Should return set-cookie header to clear the cookie");
    assert.ok(setCookie[0].includes("refreshToken="), "Should contain refreshToken cookie modification");
    assert.ok(setCookie[0].includes("Expires="), "Should expire the cookie");

    // Check redis calls
    assert.ok(redisSetStub.calledWith(sinon.match(`blacklist:${mockAccessToken}`)), "Access token should be blacklisted");
    assert.ok(redisSetStub.calledWith(sinon.match(`blacklist:${mockRefreshToken}`)), "Refresh token should be blacklisted");
    assert.ok(redisDelStub.calledWith("refreshToken:1:test-jti-123"), "Redis session key should be deleted");
  });

  it("should return 200 and clear cookie even if no tokens are provided (idempotency)", async () => {
    const response = await pactum.spec()
      .post("/auth/logout")
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Đăng xuất thành công"
      });

    const setCookie = response.headers["set-cookie"];
    assert.ok(setCookie, "Should return set-cookie header");
    assert.strictEqual(redisSetStub.called, false, "No tokens should be set to blacklist if none provided");
    assert.strictEqual(redisDelStub.called, false, "No Redis keys should be deleted if no refresh token provided");
  });
});
