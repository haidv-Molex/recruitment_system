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
import getUserController from "@controller/user/getUserController";
import User from "@/services/user/_User";
import { AppError } from "@middlewares/AppError";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("getUserController API", () => {
  let findByIdStub: sinon.SinonStub;
  let checkUserBannedStub: sinon.SinonStub;
  let poolConnectStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;
  let mockCurrentUser: any = null;
  let expectLocal: any;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expectLocal = localExpect;

    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/user", getUserController);
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
    checkUserBannedStub = sinon.stub(User, "checkUserBanned").resolves();

    // findById behaves differently depending on target ID
    findByIdStub = sinon.stub(User, "findById");
  });

  afterEach(() => {
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

  it("should return 200 and public profile (excluding account/password) for valid ID", async () => {
    // Current user requesting
    mockCurrentUser = {
      user_id: 1,
      user_name: "Current User",
      user_role: "user"
    };
    const token = generateTestToken(1, "Current User");

    // Target user to fetch
    const targetUser = {
      user_id: 99,
      user_name: "Target User Profile",
      user_description: "Target Description",
      user_role: "user"
    };

    // First call is passport verifying current user, second is fetching target
    findByIdStub.onFirstCall().resolves(mockCurrentUser);
    findByIdStub.onSecondCall().resolves(targetUser);

    const response = await pactum.spec()
      .get("/user?id=99")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(200);

    const body = response.body;
    expectLocal(body.result).to.be.true;
    expectLocal(body.data.user_id).to.equal(99);
    expectLocal(body.data.user_name).to.equal("Target User Profile");
    expectLocal(body.data.user_description).to.equal("Target Description");
    expectLocal(body.data.user_role).to.equal("user");

    // Ensure sensitive information is hidden
    expectLocal(body.data.user_account).to.be.undefined;
    expectLocal(body.data.user_password).to.be.undefined;

    sinon.assert.calledTwice(findByIdStub);
  });

  it("should return 404 when requested user does not exist", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Current User",
      user_role: "user"
    };
    const token = generateTestToken(1, "Current User");

    findByIdStub.onFirstCall().resolves(mockCurrentUser);
    findByIdStub.onSecondCall().rejects(new AppError("Không tìm thấy người dùng", 404));

    await pactum.spec()
      .get("/user?id=999")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(404)
      .expectJsonLike({
        result: false,
        message: "Không tìm thấy người dùng"
      });

    sinon.assert.calledTwice(findByIdStub);
  });

  it("should return 400 validation error if user ID is not a positive integer", async () => {
    mockCurrentUser = {
      user_id: 1,
      user_name: "Current User",
      user_role: "user"
    };
    const token = generateTestToken(1, "Current User");

    findByIdStub.resolves(mockCurrentUser);

    await pactum.spec()
      .get("/user?id=-5")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Mã người dùng phải là số dương"]
      });

    await pactum.spec()
      .get("/user?id=abc")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(400)
      .expectJsonLike({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Mã người dùng phải là số"]
      });

    sinon.assert.calledTwice(findByIdStub); // validation fails after auth succeeds
  });

  it("should return 401 if request is unauthenticated", async () => {
    await pactum.spec()
      .get("/user?id=99")
      .expectStatus(401);

    sinon.assert.notCalled(findByIdStub);
  });
});
