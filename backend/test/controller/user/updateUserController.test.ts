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
import updateUserController from "@controller/user/updateUserController";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("updateUserController API", () => {
  let expectLocal: any;
  let updateProfileStub: sinon.SinonStub;
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
    app.use("/user", updateUserController);
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
    updateProfileStub = sinon.stub(User, "updateProfile");
    checkUserBannedStub = sinon.stub(User, "checkUserBanned").resolves();

    findByIdStub = sinon.stub(User, "findById");
  });

  afterEach(() => {
    updateProfileStub.restore();
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

  it("should successfully update user details when target is a regular user", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Requester",
      user_role: "user"
    };

    const targetUser = {
      user_id: 99,
      user_name: "Old Name",
      user_role: "user"
    };

    const mockUpdatedUser = {
      user_id: 99,
      user_name: "New Name",
      user_description: "New Desc",
      user_role: "user"
    };

    // First call: passport authenticates current user (calls findById for user_id = 1)
    // Second call: controller fetches target user (calls findById for user_id = 99)
    findByIdStub.withArgs(1).resolves(mockCurrentUser);
    findByIdStub.withArgs(99).resolves(targetUser);

    updateProfileStub.resolves(mockUpdatedUser);

    const token = generateTestToken(1, "Requester");

    await pactum.spec()
      .put("/user?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: "New Name",
        description: "New Desc"
      })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin người dùng thành công",
        data: mockUpdatedUser
      });

    expectLocal(updateProfileStub.calledOnce).to.be.true;
    expectLocal(updateProfileStub.firstCall.args[0]).to.equal(99);
    expectLocal(updateProfileStub.firstCall.args[1]).to.deep.equal({
      username: "New Name",
      description: "New Desc"
    });
  });

  it("should return 403 when trying to update an admin account", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Requester",
      user_role: "user"
    };

    const targetUser = {
      user_id: 99,
      user_name: "Admin User",
      user_role: "admin"
    };

    findByIdStub.withArgs(1).resolves(mockCurrentUser);
    findByIdStub.withArgs(99).resolves(targetUser);

    const token = generateTestToken(1, "Requester");

    await pactum.spec()
      .put("/user?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: "Modified Admin Name"
      })
      .expectStatus(403)
      .expectJsonLike({
        result: false,
        message: "Không thể chỉnh sửa thông tin của tài khoản HR hoặc Admin"
      });

    expectLocal(updateProfileStub.called).to.be.false;
  });

  it("should return 403 when trying to update an hr account", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Requester",
      user_role: "hr"
    };

    const targetUser = {
      user_id: 99,
      user_name: "HR User",
      user_role: "hr"
    };

    findByIdStub.withArgs(1).resolves(mockCurrentUser);
    findByIdStub.withArgs(99).resolves(targetUser);

    const token = generateTestToken(1, "Requester");

    await pactum.spec()
      .put("/user?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: "Modified HR Name"
      })
      .expectStatus(403)
      .expectJsonLike({
        result: false,
        message: "Không thể chỉnh sửa thông tin của tài khoản HR hoặc Admin"
      });

    expectLocal(updateProfileStub.called).to.be.false;
  });

  it("should successfully update hr user details when requester is an admin", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Requester",
      user_role: "admin"
    };

    const targetUser = {
      user_id: 99,
      user_name: "HR User",
      user_role: "hr"
    };

    const mockUpdatedUser = {
      user_id: 99,
      user_name: "New HR Name",
      user_description: "New HR Desc",
      user_role: "hr"
    };

    findByIdStub.withArgs(1).resolves(mockCurrentUser);
    findByIdStub.withArgs(99).resolves(targetUser);

    updateProfileStub.resolves(mockUpdatedUser);

    const token = generateTestToken(1, "Requester");

    await pactum.spec()
      .put("/user?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: "New HR Name",
        description: "New HR Desc"
      })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin người dùng thành công",
        data: mockUpdatedUser
      });

    expectLocal(updateProfileStub.calledOnce).to.be.true;
    expectLocal(updateProfileStub.firstCall.args[0]).to.equal(99);
  });

  it("should return 400 validation error if body is empty", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Requester",
      user_role: "user"
    };

    findByIdStub.withArgs(1).resolves(mockCurrentUser);

    const token = generateTestToken(1, "Requester");

    await pactum.spec()
      .put("/user?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({})
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Phải cung cấp ít nhất tên người dùng hoặc mô tả để cập nhật"]
      });

    expectLocal(updateProfileStub.called).to.be.false;
  });

  it("should return 401 if request is unauthenticated", async () => {
    await pactum.spec()
      .put("/user?id=99")
      .withJson({
        username: "Some Name"
      })
      .expectStatus(401);

    expectLocal(updateProfileStub.called).to.be.false;
  });
});
