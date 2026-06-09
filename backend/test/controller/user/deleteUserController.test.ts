process.env.SECRET_AUTH_TOKEN_KEY = "recruitment_system";
process.env.EXPIRES_TOKEN = "15m";
process.env.EXPIRES_REFRESH_TOKEN = "30d";

import "express-async-errors";
import sinon from "sinon";
import passport from "@middlewares/passport";
import { pool } from "@middlewares/database";
import jwt from "jsonwebtoken";
import express from "express";
import pactum from "pactum";
import deleteUserController from "@controller/user/deleteUserController";
import User from "@services/user/User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("deleteUserController API", () => {
  let expectLocal: any;
  let deleteAccountStub: sinon.SinonStub;
  let findByIdStub: sinon.SinonStub;
  let checkUserBannedStub: sinon.SinonStub;
  let poolConnectStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;
  let mockCurrentUser: any = null;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expectLocal = localExpect;

    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/user/:user_id", deleteUserController);
    app.use(globalErrorHandler);

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
    deleteAccountStub = sinon.stub(User, "deleteAccount").resolves();
    checkUserBannedStub = sinon.stub(User, "checkUserBanned").resolves();
    findByIdStub = sinon.stub(User, "findById").callsFake(async (userId) => {
      return mockCurrentUser;
    });
  });

  afterEach(() => {
    deleteAccountStub.restore();
    findByIdStub.restore();
    checkUserBannedStub.restore();
    poolConnectStub.restore();
  });

  after((done) => {
    server.close(done);
  });

  function generateTestToken(userId: number, username: string) {
    const secret = process.env.SECRET_AUTH_TOKEN_KEY || "recruitment_system";
    return jwt.sign({ user_id: userId, user_name: username }, secret, {
      expiresIn: "15m"
    });
  }

  it("should delete a regular user when requestor is admin", async () => {
    // findById: first call for JWT auth (userId = 1), second call for target (userId = 99)
    findByIdStub.onFirstCall().resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });
    findByIdStub.onSecondCall().resolves({ user_id: 99, user_name: "Regular User", user_role: "user" });

    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .delete("/user/99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(200)
      .expectJson({ result: true, message: "Xóa người dùng thành công" });

    expectLocal(deleteAccountStub.calledOnce).to.be.true;
    expectLocal(deleteAccountStub.firstCall.args[0]).to.equal(99);
  });

  it("should delete a regular user when requestor is hr", async () => {
    findByIdStub.onFirstCall().resolves({ user_id: 2, user_name: "HR Person", user_role: "hr" });
    findByIdStub.onSecondCall().resolves({ user_id: 99, user_name: "Regular User", user_role: "user" });

    const token = generateTestToken(2, "HR Person");

    await pactum.spec()
      .delete("/user/99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(200)
      .expectJson({ result: true, message: "Xóa người dùng thành công" });

    expectLocal(deleteAccountStub.calledOnce).to.be.true;
  });

  it("should return 403 when requestor is a regular user", async () => {
    findByIdStub.onFirstCall().resolves({ user_id: 3, user_name: "Regular", user_role: "user" });

    const token = generateTestToken(3, "Regular");

    await pactum.spec()
      .delete("/user/99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(403)
      .expectJsonLike({ result: false, message: "Chỉ Admin hoặc HR mới có quyền xóa tài khoản người dùng" });

    expectLocal(deleteAccountStub.called).to.be.false;
  });

  it("should return 403 when trying to delete an admin account", async () => {
    findByIdStub.onFirstCall().resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });
    findByIdStub.onSecondCall().resolves({ user_id: 99, user_name: "Other Admin", user_role: "admin" });

    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .delete("/user/99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(403)
      .expectJsonLike({ result: false, message: "Không thể xóa tài khoản Admin hoặc HR" });

    expectLocal(deleteAccountStub.called).to.be.false;
  });

  it("should return 403 when trying to delete an hr account", async () => {
    findByIdStub.onFirstCall().resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });
    findByIdStub.onSecondCall().resolves({ user_id: 99, user_name: "HR Person", user_role: "hr" });

    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .delete("/user/99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(403)
      .expectJsonLike({ result: false, message: "Không thể xóa tài khoản Admin hoặc HR" });

    expectLocal(deleteAccountStub.called).to.be.false;
  });

  it("should return 400 validation error for invalid user_id", async () => {
    findByIdStub.onFirstCall().resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });
    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .delete("/user/abc")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(400)
      .expectJsonLike({ result: false, message: "Dữ liệu không hợp lệ" });

    expectLocal(deleteAccountStub.called).to.be.false;
  });

  it("should return 401 if request is unauthenticated", async () => {
    await pactum.spec()
      .delete("/user/99")
      .expectStatus(401);

    expectLocal(deleteAccountStub.called).to.be.false;
  });
});
