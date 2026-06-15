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
import PlatformController from "@controller/platform/_PlatformController";
import Platform from "@services/platform/_Platform";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("PlatformController API", () => {
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
    app.use("/platform", PlatformController);
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

    // Platform stubs
    createStub = sinon.stub(Platform, "create");
    getAllStub = sinon.stub(Platform, "getAll");
    getByIdStub = sinon.stub(Platform, "getById");
    updateStub = sinon.stub(Platform, "update");
    deleteStub = sinon.stub(Platform, "delete");
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

  it("POST /platform - should create platform successfully", async () => {
    const mockPlatform = { platform_id: 1, platform_name: "LinkedIn", platform_description: "Professional network" };
    createStub.resolves(mockPlatform);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/platform")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ platform_name: "LinkedIn", platform_description: "Professional network" })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo nền tảng thành công",
        data: mockPlatform
      });

    expectLocal(createStub.calledOnce).to.be.true;
  });

  it("GET /platform - should get all platforms successfully", async () => {
    const mockList = {
      items: [{ platform_id: 1, platform_name: "LinkedIn", platform_description: "Professional network" }],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/platform/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ page: 1, limit: 10 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy danh sách nền tảng thành công",
        data: mockList.items,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1
        }
      });

    expectLocal(getAllStub.calledOnce).to.be.true;
  });

  it("GET /platform - should search platforms by name", async () => {
    const mockList = {
      items: [{ platform_id: 1, platform_name: "LinkedIn", platform_description: "Professional network" }],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/platform/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ search: "Linked" })
      .expectStatus(200);

    expectLocal(getAllStub.calledWith({ page: 1, limit: 10, unlimited: false, search: "Linked" })).to.be.true;
  });

  it("GET /platform/:id - should get platform by id", async () => {
    const mockPlatform = { platform_id: 1, platform_name: "LinkedIn", platform_description: "Professional network" };
    getByIdStub.resolves(mockPlatform);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/platform")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy thông tin nền tảng thành công",
        data: mockPlatform
      });

    expectLocal(getByIdStub.calledOnceWith(1)).to.be.true;
  });

  it("PUT /platform/:id - should update platform successfully", async () => {
    const mockPlatform = { platform_id: 1, platform_name: "LinkedIn Jobs", platform_description: "Professional network" };
    updateStub.resolves(mockPlatform);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/platform")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withJson({ platform_name: "LinkedIn Jobs" })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin nền tảng thành công",
        data: mockPlatform
      });

    expectLocal(updateStub.calledOnceWith(1, { platform_name: "LinkedIn Jobs" })).to.be.true;
  });

  it("DELETE /platform/:id - should delete platform successfully", async () => {
    deleteStub.resolves();

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .delete("/platform")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Xóa nền tảng thành công"
      });

    expectLocal(deleteStub.calledOnceWith([1])).to.be.true;
  });
});
