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
import changeAccountRoleController from "@/controller/user/changeAccountRoleController";
import User from "@services/user/User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";
import { AppError } from "@middlewares/AppError";

describe("banAccountController API", () => {
  let expectLocal: any;
  let changeRoleStub: sinon.SinonStub;
  let findByIdStub: sinon.SinonStub;
  let checkUserBannedStub: sinon.SinonStub;
  let poolConnectStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expectLocal = localExpect;

    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/user", changeAccountRoleController);
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
    changeRoleStub = sinon.stub(User, "changeRole").resolves();
    checkUserBannedStub = sinon.stub(User, "checkUserBanned").resolves();
    findByIdStub = sinon.stub(User, "findById");
  });

  afterEach(() => {
    changeRoleStub.restore();
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

  it("should change role to 'banned' when requestor is admin", async () => {
    findByIdStub.resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });

    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .patch("/user/role?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ role: "banned" })
      .expectStatus(200)
      .expectJsonLike({ result: true, message: "Đã chuyển tài khoản sang role 'banned' thành công" });

    expectLocal(changeRoleStub.calledOnce).to.be.true;
    expectLocal(changeRoleStub.firstCall.args[0]).to.equal(99);
    expectLocal(changeRoleStub.firstCall.args[1]).to.equal("banned");
  });

  it("should change role back to 'hr' when requestor is admin", async () => {
    findByIdStub.resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });

    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .patch("/user/role?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ role: "hr" })
      .expectStatus(200)
      .expectJsonLike({ result: true, message: "Đã chuyển tài khoản sang role 'hr' thành công" });

    expectLocal(changeRoleStub.calledOnce).to.be.true;
    expectLocal(changeRoleStub.firstCall.args[1]).to.equal("hr");
  });

  it("should return 400 if role is an invalid value", async () => {
    findByIdStub.resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });

    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .patch("/user/role?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ role: "admin" })
      .expectStatus(400)
      .expectJsonLike({ result: false, message: "Dữ liệu không hợp lệ" });

    expectLocal(changeRoleStub.called).to.be.false;
  });

  it("should return 400 if role field is missing", async () => {
    findByIdStub.resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });

    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .patch("/user/role?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({})
      .expectStatus(400)
      .expectJsonLike({ result: false, message: "Dữ liệu không hợp lệ" });

    expectLocal(changeRoleStub.called).to.be.false;
  });

  it("should return 403 when requestor is HR (not admin)", async () => {
    findByIdStub.resolves({ user_id: 2, user_name: "HR Person", user_role: "hr" });

    const token = generateTestToken(2, "HR Person");

    await pactum.spec()
      .patch("/user/role?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ role: "banned" })
      .expectStatus(403)
      .expectJsonLike({ result: false, message: "Chỉ Admin mới có quyền thay đổi role HR" });

    expectLocal(changeRoleStub.called).to.be.false;
  });

  it("should return 404 when target user's current role is not hr/banned", async () => {
    findByIdStub.resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });
    changeRoleStub.rejects(new AppError("Không tìm thấy tài khoản hoặc tài khoản không ở role có thể chuyển sang 'banned'", 404));

    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .patch("/user/role?id=999")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ role: "banned" })
      .expectStatus(404);
  });

  it("should return 400 validation error for invalid user_id", async () => {
    findByIdStub.resolves({ user_id: 1, user_name: "Admin", user_role: "admin" });
    const token = generateTestToken(1, "Admin");

    await pactum.spec()
      .patch("/user/role?id=abc")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ role: "banned" })
      .expectStatus(400)
      .expectJsonLike({ result: false, message: "Dữ liệu không hợp lệ" });

    expectLocal(changeRoleStub.called).to.be.false;
  });

  it("should return 401 if request is unauthenticated", async () => {
    await pactum.spec()
      .patch("/user/role?id=99")
      .withJson({ role: "banned" })
      .expectStatus(401);

    expectLocal(changeRoleStub.called).to.be.false;
  });
});
