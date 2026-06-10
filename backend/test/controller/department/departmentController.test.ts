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
import DepartmentController from "@controller/department/_DepartmentController";
import Department from "@services/department/_Department";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("DepartmentController API", () => {
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
    app.use("/department", DepartmentController);
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

    // Department stubs
    createStub = sinon.stub(Department, "create");
    getAllStub = sinon.stub(Department, "getAll");
    getByIdStub = sinon.stub(Department, "getById");
    updateStub = sinon.stub(Department, "update");
    deleteStub = sinon.stub(Department, "delete");
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

  it("POST /department - should create department successfully", async () => {
    const mockDept = { department_id: 1, department_code: "IT", department_name: "Tech", department_description: "IT Support", create_at: new Date(), update_at: new Date() };
    createStub.resolves(mockDept);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/department")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ department_code: "IT", department_name: "Tech", department_description: "IT Support" })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo phòng ban thành công",
        data: {
          ...mockDept,
          create_at: mockDept.create_at.toISOString(),
          update_at: mockDept.update_at.toISOString()
        }
      });

    expectLocal(createStub.calledOnce).to.be.true;
  });

  it("GET /department - should get all departments successfully", async () => {
    const mockDept = { department_id: 1, department_code: "IT", department_name: "Tech", department_description: "IT Support", create_at: new Date(), update_at: new Date() };
    const mockList = {
      items: [mockDept],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/department/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ page: 1, limit: 10 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy danh sách phòng ban thành công",
        data: [{
          ...mockDept,
          create_at: mockDept.create_at.toISOString(),
          update_at: mockDept.update_at.toISOString()
        }],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1
        }
      });

    expectLocal(getAllStub.calledOnce).to.be.true;
  });

  it("GET /department - should search departments by name or code", async () => {
    const mockDept = { department_id: 1, department_code: "IT", department_name: "Tech", department_description: "IT Support", create_at: new Date(), update_at: new Date() };
    const mockList = {
      items: [mockDept],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/department/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ search: "Tech" })
      .expectStatus(200);

    expectLocal(getAllStub.calledWith({ page: 1, limit: 10, unlimited: false, search: "Tech" })).to.be.true;
  });

  it("GET /department/:id - should get department by id", async () => {
    const mockDept = { department_id: 1, department_code: "IT", department_name: "Tech", department_description: "IT Support", create_at: new Date(), update_at: new Date() };
    getByIdStub.resolves(mockDept);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/department")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy thông tin phòng ban thành công",
        data: {
          ...mockDept,
          create_at: mockDept.create_at.toISOString(),
          update_at: mockDept.update_at.toISOString()
        }
      });

    expectLocal(getByIdStub.calledOnceWith(1)).to.be.true;
  });

  it("PUT /department/:id - should update department successfully", async () => {
    const mockDept = { department_id: 1, department_code: "IT", department_name: "Information Technology", department_description: "IT Support", create_at: new Date(), update_at: new Date() };
    updateStub.resolves(mockDept);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/department")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withJson({ department_name: "Information Technology" })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin phòng ban thành công",
        data: {
          ...mockDept,
          create_at: mockDept.create_at.toISOString(),
          update_at: mockDept.update_at.toISOString()
        }
      });

    expectLocal(updateStub.calledOnceWith(1, { department_name: "Information Technology" })).to.be.true;
  });

  it("DELETE /department/:id - should delete department successfully", async () => {
    deleteStub.resolves();

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .delete("/department")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Xóa phòng ban thành công"
      });

    expectLocal(deleteStub.calledOnceWith(1)).to.be.true;
  });
});
