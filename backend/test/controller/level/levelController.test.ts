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
import LevelController from "@controller/level/_LevelController";
import Level from "@services/level/_Level";
import User from "@services/user/User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("LevelController API", () => {
  let expectLocal: any;
  let poolConnectStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;
  let mockCurrentUser: any = null;

  // Stubs
  let findByIdStub: sinon.SinonStub;
  let checkUserBannedStub: sinon.SinonStub;
  let createStub: sinon.SinonStub;
  let getAllStub: sinon.SinonStub;
  let getByIdStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;
  let deleteStub: sinon.SinonStub;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expectLocal = localExpect;

    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/level", LevelController);
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
    
    // Auth stubs
    checkUserBannedStub = sinon.stub(User, "checkUserBanned").resolves();
    mockCurrentUser = { user_id: 1, user_name: "Test User", user_role: "hr" };
    findByIdStub = sinon.stub(User, "findById").resolves(mockCurrentUser);

    // Level stubs
    createStub = sinon.stub(Level, "create");
    getAllStub = sinon.stub(Level, "getAll");
    getByIdStub = sinon.stub(Level, "getById");
    updateStub = sinon.stub(Level, "update");
    deleteStub = sinon.stub(Level, "delete");
  });

  afterEach(() => {
    poolConnectStub.restore();
    checkUserBannedStub.restore();
    findByIdStub.restore();
    createStub.restore();
    getAllStub.restore();
    getByIdStub.restore();
    updateStub.restore();
    deleteStub.restore();
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

  it("POST /level - should create level successfully", async () => {
    const mockLevel = { level_id: 1, level_code: "L1", level_name: "Junior", level_description: "Junior developer", create_at: new Date(), update_at: new Date() };
    createStub.resolves(mockLevel);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/level")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ level_code: "L1", level_name: "Junior", level_description: "Junior developer" })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo cấp bậc thành công",
        data: {
          ...mockLevel,
          create_at: mockLevel.create_at.toISOString(),
          update_at: mockLevel.update_at.toISOString()
        }
      });

    expectLocal(createStub.calledOnce).to.be.true;
  });

  it("GET /level/search - should get all levels successfully", async () => {
    const mockLevel = { level_id: 1, level_code: "L1", level_name: "Junior", level_description: "Junior developer", create_at: new Date(), update_at: new Date() };
    const mockList = {
      items: [mockLevel],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/level/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ page: 1, limit: 10 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy danh sách cấp bậc thành công",
        data: [{
          ...mockLevel,
          create_at: mockLevel.create_at.toISOString(),
          update_at: mockLevel.update_at.toISOString()
        }],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1
        }
      });

    expectLocal(getAllStub.calledOnce).to.be.true;
  });

  it("GET /level/search - should search levels by name or code", async () => {
    const mockLevel = { level_id: 1, level_code: "L1", level_name: "Junior", level_description: "Junior developer", create_at: new Date(), update_at: new Date() };
    const mockList = {
      items: [mockLevel],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/level/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ search: "Junior" })
      .expectStatus(200);

    expectLocal(getAllStub.calledWith({ page: 1, limit: 10, unlimited: false, search: "Junior" })).to.be.true;
  });

  it("GET /level - should get level by id", async () => {
    const mockLevel = { level_id: 1, level_code: "L1", level_name: "Junior", level_description: "Junior developer", create_at: new Date(), update_at: new Date() };
    getByIdStub.resolves(mockLevel);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/level")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy thông tin cấp bậc thành công",
        data: {
          ...mockLevel,
          create_at: mockLevel.create_at.toISOString(),
          update_at: mockLevel.update_at.toISOString()
        }
      });

    expectLocal(getByIdStub.calledOnceWith(1)).to.be.true;
  });

  it("PUT /level - should update level successfully", async () => {
    const mockLevel = { level_id: 1, level_code: "L1", level_name: "Junior Developer", level_description: "Junior developer", create_at: new Date(), update_at: new Date() };
    updateStub.resolves(mockLevel);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/level")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withJson({ level_name: "Junior Developer" })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin cấp bậc thành công",
        data: {
          ...mockLevel,
          create_at: mockLevel.create_at.toISOString(),
          update_at: mockLevel.update_at.toISOString()
        }
      });

    expectLocal(updateStub.calledOnceWith(1, { level_name: "Junior Developer" })).to.be.true;
  });

  it("DELETE /level - should delete level successfully", async () => {
    deleteStub.resolves();

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .delete("/level")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Xóa cấp bậc thành công"
      });

    expectLocal(deleteStub.calledOnceWith(1)).to.be.true;
  });
});
