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
import SegmentController from "@controller/segment/_SegmentController";
import Segment from "@services/segment/_Segment";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("SegmentController API", () => {
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
    app.use("/segment", SegmentController);
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

    // Segment stubs
    createStub = sinon.stub(Segment, "create");
    getAllStub = sinon.stub(Segment, "getAll");
    getByIdStub = sinon.stub(Segment, "getById");
    updateStub = sinon.stub(Segment, "update");
    deleteStub = sinon.stub(Segment, "delete");
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

  it("POST /segment - should create segment successfully", async () => {
    const mockSeg = { segment_id: 1, segment_code: "SEG01", segment_name: "Premium", segment_description: "Premium candidates", create_at: new Date(), update_at: new Date() };
    createStub.resolves(mockSeg);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/segment")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ segment_code: "SEG01", segment_name: "Premium", segment_description: "Premium candidates" })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo phân khúc thành công",
        data: {
          ...mockSeg,
          create_at: mockSeg.create_at.toISOString(),
          update_at: mockSeg.update_at.toISOString()
        }
      });

    expectLocal(createStub.calledOnce).to.be.true;
  });

  it("GET /segment - should get all segments successfully", async () => {
    const mockSeg = { segment_id: 1, segment_code: "SEG01", segment_name: "Premium", segment_description: "Premium candidates", create_at: new Date(), update_at: new Date() };
    const mockList = {
      items: [mockSeg],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/segment/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ page: 1, limit: 10 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy danh sách phân khúc thành công",
        data: [{
          ...mockSeg,
          create_at: mockSeg.create_at.toISOString(),
          update_at: mockSeg.update_at.toISOString()
        }],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1
        }
      });

    expectLocal(getAllStub.calledOnce).to.be.true;
  });

  it("GET /segment - should search segments by name or code", async () => {
    const mockSeg = { segment_id: 1, segment_code: "SEG01", segment_name: "Premium", segment_description: "Premium candidates", create_at: new Date(), update_at: new Date() };
    const mockList = {
      items: [mockSeg],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/segment/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ search: "SEG" })
      .expectStatus(200);

    expectLocal(getAllStub.calledWith({ page: 1, limit: 10, unlimited: false, search: "SEG" })).to.be.true;
  });

  it("GET /segment/:id - should get segment by id", async () => {
    const mockSeg = { segment_id: 1, segment_code: "SEG01", segment_name: "Premium", segment_description: "Premium candidates", create_at: new Date(), update_at: new Date() };
    getByIdStub.resolves(mockSeg);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/segment")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy thông tin phân khúc thành công",
        data: {
          ...mockSeg,
          create_at: mockSeg.create_at.toISOString(),
          update_at: mockSeg.update_at.toISOString()
        }
      });

    expectLocal(getByIdStub.calledOnceWith(1)).to.be.true;
  });

  it("PUT /segment/:id - should update segment successfully", async () => {
    const mockSeg = { segment_id: 1, segment_code: "SEG01", segment_name: "Premium Candidates", segment_description: "Premium candidates", create_at: new Date(), update_at: new Date() };
    updateStub.resolves(mockSeg);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/segment")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withJson({ segment_name: "Premium Candidates" })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin phân khúc thành công",
        data: {
          ...mockSeg,
          create_at: mockSeg.create_at.toISOString(),
          update_at: mockSeg.update_at.toISOString()
        }
      });

    expectLocal(updateStub.calledOnceWith(1, { segment_name: "Premium Candidates" })).to.be.true;
  });

  it("DELETE /segment/:id - should delete segment successfully", async () => {
    deleteStub.resolves();

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .delete("/segment")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Xóa phân khúc thành công"
      });

    expectLocal(deleteStub.calledOnceWith([1])).to.be.true;
  });
});
