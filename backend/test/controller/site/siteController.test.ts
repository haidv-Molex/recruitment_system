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
import SiteController from "@controller/site/_SiteController";
import Site from "@services/site/_Site";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("SiteController API", () => {
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
    app.use("/site", SiteController);
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

    // Site stubs
    createStub = sinon.stub(Site, "create");
    getAllStub = sinon.stub(Site, "getAll");
    getByIdStub = sinon.stub(Site, "getById");
    updateStub = sinon.stub(Site, "update");
    deleteStub = sinon.stub(Site, "delete");
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

  it("POST /site - should create site successfully", async () => {
    const mockSite = { site_id: 1, site_code: "HN01", site_name: "Hanoi Office", site_description: "Keangnam Building", create_at: new Date(), update_at: new Date() };
    createStub.resolves(mockSite);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/site")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ site_code: "HN01", site_name: "Hanoi Office", site_description: "Keangnam Building" })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo địa điểm thành công",
        data: {
          ...mockSite,
          create_at: mockSite.create_at.toISOString(),
          update_at: mockSite.update_at.toISOString()
        }
      });

    expectLocal(createStub.calledOnce).to.be.true;
  });

  it("GET /site - should get all sites successfully", async () => {
    const mockSite = { site_id: 1, site_code: "HN01", site_name: "Hanoi Office", site_description: "Keangnam Building", create_at: new Date(), update_at: new Date() };
    const mockList = {
      items: [mockSite],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/site/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ page: 1, limit: 10 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy danh sách địa điểm thành công",
        data: [{
          ...mockSite,
          create_at: mockSite.create_at.toISOString(),
          update_at: mockSite.update_at.toISOString()
        }],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1
        }
      });

    expectLocal(getAllStub.calledOnce).to.be.true;
  });

  it("GET /site - should search sites by name or code", async () => {
    const mockSite = { site_id: 1, site_code: "HN01", site_name: "Hanoi Office", site_description: "Keangnam Building", create_at: new Date(), update_at: new Date() };
    const mockList = {
      items: [mockSite],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/site/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ search: "HN" })
      .expectStatus(200);

    expectLocal(getAllStub.calledWith({ page: 1, limit: 10, unlimited: false, search: "HN" })).to.be.true;
  });

  it("GET /site/:id - should get site by id", async () => {
    const mockSite = { site_id: 1, site_code: "HN01", site_name: "Hanoi Office", site_description: "Keangnam Building", create_at: new Date(), update_at: new Date() };
    getByIdStub.resolves(mockSite);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/site")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy thông tin địa điểm thành công",
        data: {
          ...mockSite,
          create_at: mockSite.create_at.toISOString(),
          update_at: mockSite.update_at.toISOString()
        }
      });

    expectLocal(getByIdStub.calledOnceWith(1)).to.be.true;
  });

  it("PUT /site/:id - should update site successfully", async () => {
    const mockSite = { site_id: 1, site_code: "HN01", site_name: "Hanoi Headquarters", site_description: "Keangnam Building", create_at: new Date(), update_at: new Date() };
    updateStub.resolves(mockSite);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/site")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withJson({ site_name: "Hanoi Headquarters" })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin địa điểm thành công",
        data: {
          ...mockSite,
          create_at: mockSite.create_at.toISOString(),
          update_at: mockSite.update_at.toISOString()
        }
      });

    expectLocal(updateStub.calledOnceWith(1, { site_name: "Hanoi Headquarters" })).to.be.true;
  });

  it("DELETE /site/:id - should delete site successfully", async () => {
    deleteStub.resolves();

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .delete("/site")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Xóa địa điểm thành công"
      });

    expectLocal(deleteStub.calledOnceWith(1)).to.be.true;
  });
});
