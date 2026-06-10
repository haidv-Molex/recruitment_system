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
import createUserController from "@controller/user/createUserController";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("createUserController API", () => {
  let expectLocal: any;
  let createStub: sinon.SinonStub;
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
    app.use("/user", createUserController);
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
    createStub = sinon.stub(User, "create");
    checkUserBannedStub = sinon.stub(User, "checkUserBanned").resolves();

    findByIdStub = sinon.stub(User, "findById").callsFake(async (userId, p) => {
      return mockCurrentUser;
    });
  });

  afterEach(() => {
    createStub.restore();
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

  it("should successfully create user for any authenticated user", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Regular User",
      user_role: "user"
    };

    const mockCreatedUser = {
      user_id: 5,
      user_name: "Created User Name",
      user_description: "New User Description",
      department_id: 12,
      user_role: "user"
    };
    createStub.resolves(mockCreatedUser);

    const token = generateTestToken(1, "Regular User");

    await pactum.spec()
      .post("/user")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        username: "Created User Name",
        description: "New User Description",
        departmentId: 12
      })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo người dùng thành công",
        data: mockCreatedUser
      });

    expectLocal(createStub.calledOnce).to.be.true;
    expectLocal(createStub.firstCall.args[0]).to.deep.equal({
      username: "Created User Name",
      description: "New User Description",
      departmentId: 12
    });
  });

  it("should return validation error if username is empty or missing", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Regular User",
      user_role: "user"
    };

    const token = generateTestToken(1, "Regular User");

    await pactum.spec()
      .post("/user")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({
        description: "Missing username"
      })
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Tên người dùng là bắt buộc"]
      });

    expectLocal(createStub.called).to.be.false;
  });

  it("should return 401 if request is unauthenticated", async () => {
    await pactum.spec()
      .post("/user")
      .withJson({
        username: "New User"
      })
      .expectStatus(401);

    expectLocal(createStub.called).to.be.false;
  });
});
