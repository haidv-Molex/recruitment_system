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
import CompanyController from "@controller/company/_CompanyController";
import Company from "@services/company/_Company";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("CompanyController API", () => {
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
    app.use("/company", CompanyController);
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

    // Company stubs
    createStub = sinon.stub(Company, "create");
    getAllStub = sinon.stub(Company, "getAll");
    getByIdStub = sinon.stub(Company, "getById");
    updateStub = sinon.stub(Company, "update");
    deleteStub = sinon.stub(Company, "delete");
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

  it("POST /company - should create company successfully", async () => {
    const mockCompany = { company_id: 1, company_name: "Google", company_description: "Search Engine" };
    createStub.resolves(mockCompany);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/company")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ company_name: "Google", company_description: "Search Engine" })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo công ty thành công",
        data: mockCompany
      });

    expectLocal(createStub.calledOnce).to.be.true;
  });

  it("GET /company - should get all companies successfully", async () => {
    const mockList = {
      items: [{ company_id: 1, company_name: "Google", company_description: "Search Engine" }],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/company/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ page: 1, limit: 10 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy danh sách công ty thành công",
        data: mockList.items,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1
        }
      });

    expectLocal(getAllStub.calledOnce).to.be.true;
  });

  it("GET /company - should search companies by name", async () => {
    const mockList = {
      items: [{ company_id: 1, company_name: "Google", company_description: "Search Engine" }],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/company/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ search: "Goo" })
      .expectStatus(200);

    expectLocal(getAllStub.calledWith({ page: 1, limit: 10, unlimited: false, search: "Goo" })).to.be.true;
  });

  it("GET /company/:id - should get company by id", async () => {
    const mockCompany = { company_id: 1, company_name: "Google", company_description: "Search Engine" };
    getByIdStub.resolves(mockCompany);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/company")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy thông tin công ty thành công",
        data: mockCompany
      });

    expectLocal(getByIdStub.calledOnceWith(1)).to.be.true;
  });

  it("PUT /company/:id - should update company successfully", async () => {
    const mockCompany = { company_id: 1, company_name: "Alphabet", company_description: "Search Engine" };
    updateStub.resolves(mockCompany);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/company")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withJson({ company_name: "Alphabet" })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin công ty thành công",
        data: mockCompany
      });

    expectLocal(updateStub.calledOnceWith(1, { company_name: "Alphabet" })).to.be.true;
  });

  it("DELETE /company/:id - should delete company successfully", async () => {
    deleteStub.resolves();

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .delete("/company")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Xóa công ty thành công"
      });

    expectLocal(deleteStub.calledOnceWith(1)).to.be.true;
  });
});
