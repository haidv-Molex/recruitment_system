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
import changePasswordController from "@/controller/auth/changePasswordController";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("changePasswordController API", () => {
  let comparePasswordStub: sinon.SinonStub;
  let updatePasswordStub: sinon.SinonStub;
  let findByIdStub: sinon.SinonStub;
  let checkUserBannedStub: sinon.SinonStub;
  let poolConnectStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;
  let mockCurrentUser: any = null;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/auth/change-password", changePasswordController);
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
    comparePasswordStub = sinon.stub(User, "comparePassword");
    updatePasswordStub = sinon.stub(User, "updatePassword");
    checkUserBannedStub = sinon.stub(User, "checkUserBanned").resolves();

    findByIdStub = sinon.stub(User, "findById").callsFake(async () => {
      return mockCurrentUser;
    });
  });

  afterEach(() => {
    comparePasswordStub.restore();
    updatePasswordStub.restore();
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

  it("should return 200 and success message when password is changed successfully", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Test User",
      user_role: "user"
    };

    const token = generateTestToken(1, "Test User");

    comparePasswordStub.resolves(true);
    updatePasswordStub.resolves();

    await pactum.spec()
      .post("/auth/change-password")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        oldPassword: "oldPassword123",
        newPassword: "newPassword123"
      })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Đổi mật khẩu thành công"
      });

    sinon.assert.calledOnce(comparePasswordStub);
    sinon.assert.calledOnce(updatePasswordStub);
  });

  it("should return 400 when old password is incorrect", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Test User",
      user_role: "user"
    };

    const token = generateTestToken(1, "Test User");

    comparePasswordStub.resolves(false); // Incorrect current password

    await pactum.spec()
      .post("/auth/change-password")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        oldPassword: "wrongOldPassword",
        newPassword: "newPassword123"
      })
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Mật khẩu cũ không chính xác"
      });

    sinon.assert.calledOnce(comparePasswordStub);
    sinon.assert.notCalled(updatePasswordStub);
  });

  it("should return 400 validation error if oldPassword or newPassword is less than 6 characters", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Test User",
      user_role: "user"
    };

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/auth/change-password")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        oldPassword: "123",
        newPassword: "newPassword123"
      })
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Mật khẩu cũ phải từ 6 ký tự trở lên"]
      });

    sinon.assert.notCalled(comparePasswordStub);
  });
});
