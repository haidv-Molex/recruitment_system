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
import getRolesController from "@controller/user/getRolesController";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("getRolesController API", () => {
  let getRolesStub: sinon.SinonStub;
  let findByIdStub: sinon.SinonStub;
  let checkUserBannedStub: sinon.SinonStub;
  let poolConnectStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;
  let expectLocal: any;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expectLocal = localExpect;

    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/user/roles", getRolesController);
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
    
    // Stub findById because passport authenticates the user using it
    findByIdStub = sinon.stub(User, "findById").resolves({
      user_id: 1,
      user_name: "Test User",
      user_role: "user"
    });

    getRolesStub = sinon.stub(User, "getRoles").resolves(["admin", "hr", "user", "banned"]);
  });

  afterEach(() => {
    getRolesStub.restore();
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

  it("should return 200 and list of roles when authenticated", async () => {
    const token = generateTestToken(1, "Test User");

    const response = await pactum.spec()
      .get("/user/roles")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(200);

    const body = response.body;
    expectLocal(body.result).to.be.true;
    expectLocal(body.message).to.equal("Lấy danh sách vai trò thành công");
    expectLocal(body.data).to.be.an("array").that.deep.equals(["admin", "hr", "user", "banned"]);
  });

  it("should return 401 when unauthenticated", async () => {
    await pactum.spec()
      .get("/user/roles")
      .expectStatus(401);
  });
});
