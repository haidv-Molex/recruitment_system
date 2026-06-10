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
import updateProfileController from "@controller/user/updateProfileController";
import User from "@services/user/User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("updateProfileController API", () => {
  let updateProfileStub: sinon.SinonStub;
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
    app.use("/user/profile", updateProfileController);
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
    
    findByIdStub = sinon.stub(User, "findById").callsFake(async () => {
      return mockCurrentUser;
    });
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

  it("should return 200 and updated user data on successful update", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Test User",
      user_role: "user"
    };

    const token = generateTestToken(1, "Test User");

    updateProfileStub.resolves({
      user_id: 1,
      user_name: "New Name",
      user_account: "test_user",
      user_description: "New Description",
      user_role: "user"
    });

    await pactum.spec()
      .put("/user/profile")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: "New Name",
        description: "New Description"
      })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin cá nhân thành công",
        data: {
          user_id: 1,
          user_name: "New Name",
          user_account: "test_user",
          user_description: "New Description",
          user_role: "user"
        }
      });

    sinon.assert.calledOnce(updateProfileStub);
  });

  it("should return 400 validation error if both username and description are missing", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Test User",
      user_role: "user"
    };

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/user/profile")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({})
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Phải cung cấp ít nhất tên người dùng hoặc mô tả để cập nhật"]
      });

    sinon.assert.notCalled(updateProfileStub);
  });

  it("should return 400 validation error if username is empty string", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Test User",
      user_role: "user"
    };

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/user/profile")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: ""
      })
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Tên người dùng không được để trống"]
      });

    sinon.assert.notCalled(updateProfileStub);
  });

  it("should return 401 if request is unauthenticated", async () => {
    await pactum.spec()
      .put("/user/profile")
      .withJson({
        username: "New Name"
      })
      .expectStatus(401);

    sinon.assert.notCalled(updateProfileStub);
  });
});
