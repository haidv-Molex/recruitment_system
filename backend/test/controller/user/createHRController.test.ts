// Thiết lập biến môi trường trước khi load bất kỳ module nào
process.env.SECRET_AUTH_TOKEN_KEY = "recruitment_system";
process.env.EXPIRES_TOKEN = "15m";
process.env.EXPIRES_REFRESH_TOKEN = "30d";

import "express-async-errors";
import sinon from "sinon";
import passport from "@middlewares/passport";
import { pool } from "@middlewares/database";
import jwt from "jsonwebtoken";
import { expect } from "chai";
import express from "express";
import pactum from "pactum";
import createHRController from "@controller/user/createHRController";
import User from "@services/user/User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("createHRController API", () => {
  let expectLocal: any;
  let createHRStub: sinon.SinonStub;
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

    // Thiết lập Express App thực tế
    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/hr", createHRController);
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
    createHRStub = sinon.stub(User, "createHR");
    checkUserBannedStub = sinon.stub(User, "checkUserBanned").resolves();
    
    findByIdStub = sinon.stub(User, "findById").callsFake(async (userId, p) => {
      return mockCurrentUser;
    });
  });

  afterEach(() => {
    createHRStub.restore();
    findByIdStub.restore();
    checkUserBannedStub.restore();
    poolConnectStub.restore();
  });

  after((done) => {
    server.close(done);
  });

  // Helper sinh accessToken sử dụng secret thực của ứng dụng
  function generateTestToken(userId: number, username: string) {
    const secret = process.env.SECRET_AUTH_TOKEN_KEY || "recruitment_system";
    console.log("DEBUG [SIGNING TOKEN WITH SECRET]:", secret);
    return jwt.sign({ user_id: userId, user_name: username }, secret, {
      expiresIn: "15m"
    });
  }

  it("should return 403 if the creator is not an admin", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Non Admin User",
      user_role: "hr"
    };

    const token = generateTestToken(1, "Non Admin User");

    await pactum.spec()
      .post("/hr")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: "HR User",
        account: "hr@example.com",
        password: "password123"
      })
      .expectStatus(403)
      .expectJsonLike({
        result: false,
        message: "Chỉ Admin mới có quyền tạo tài khoản HR"
      });

    expectLocal(createHRStub.called).to.be.false;
  });

  it("should call User.createHR and return 201 if the creator is an admin", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Admin User",
      user_role: "admin"
    };

    const mockCreatedUser = {
      user_id: 2,
      user_name: "New HR",
      user_account: "new_hr@example.com",
      user_role: "hr"
    };
    createHRStub.resolves(mockCreatedUser);

    const token = generateTestToken(1, "Admin User");

    await pactum.spec()
      .post("/hr")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: "New HR",
        account: "new_hr@example.com",
        password: "password123",
        description: "Recruiter"
      })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo tài khoản HR thành công",
        data: mockCreatedUser
      });

    expectLocal(createHRStub.calledOnce).to.be.true;
  });

  it("should return validation error if username is missing", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Admin User",
      user_role: "admin"
    };

    const token = generateTestToken(1, "Admin User");

    await pactum.spec()
      .post("/hr")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: "",
        account: "new_hr@example.com",
        password: "password123"
      })
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Tên người dùng không được để trống"]
      });

    expectLocal(createHRStub.called).to.be.false;
  });
});
