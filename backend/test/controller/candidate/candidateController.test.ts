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
import CandidateController from "@controller/candidate/_CandidateController";
import Candidate from "@services/candidate/_Candidate";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("CandidateController API", () => {
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
    app.use("/candidate", CandidateController);
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

    // Candidate stubs
    createStub = sinon.stub(Candidate, "create");
    getAllStub = sinon.stub(Candidate, "getAll");
    getByIdStub = sinon.stub(Candidate, "getById");
    updateStub = sinon.stub(Candidate, "update");
    deleteStub = sinon.stub(Candidate, "delete");
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

  it("POST /candidate - should create candidate successfully with multipart", async () => {
    const mockCandidate = {
      candidate_id: 1,
      candidate_code: "CAND001",
      candidate_name: "John Doe",
      candidate_email: "john@example.com",
      status: "Applied",
      create_at: new Date(),
      update_at: new Date(),
      file: {
        file_id: 10,
        file_path: "cv/test.pdf",
        file_url: "http://localhost:3000/file/cv/test.pdf"
      }
    };
    createStub.resolves(mockCandidate);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/candidate")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData({
        candidate_code: "CAND001",
        candidate_name: "John Doe",
        candidate_email: "john@example.com",
        status: "Applied",
        platform_id: "1",
        recruiter: "2"
      })
      .withMultiPartFormData("file", Buffer.from("dummy cv content"), {
        filename: "cv.pdf",
        contentType: "application/pdf"
      })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo ứng viên thành công",
        data: {
          ...mockCandidate,
          create_at: mockCandidate.create_at.toISOString(),
          update_at: mockCandidate.update_at.toISOString()
        }
      });

    expectLocal(createStub.calledOnce).to.be.true;
    const args = createStub.firstCall.args[0];
    expectLocal(args.candidate_name).to.equal("John Doe");
    expectLocal(args.candidate_email).to.equal("john@example.com");
    expectLocal(args.status).to.equal("Applied");
    expectLocal(args.platform_id).to.equal(1);
    expectLocal(args.recruiter).to.equal(2);
    expectLocal(args.file).to.not.be.null;
    expectLocal(args.file.originalname).to.equal("cv.pdf");
  });

  it("POST /candidate - should return 400 validation error for invalid dates", async () => {
    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/candidate")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData({
        candidate_name: "John Doe",
        status: "Applied",
        onboard_date: "026-06-10"
      })
      .expectStatus(400)
      .expectJson({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Trường onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"]
      });
  });

  it("GET /candidate/search - should get candidates list with pagination", async () => {
    const mockCandidate = {
      candidate_id: 1,
      candidate_code: "CAND001",
      candidate_name: "John Doe",
      status: "Applied",
      create_at: new Date(),
      update_at: new Date()
    };
    const mockList = {
      items: [mockCandidate],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/candidate/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ page: 1, limit: 10, search: "John", status: "Applied" })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy danh sách ứng viên thành công",
        data: [{
          ...mockCandidate,
          create_at: mockCandidate.create_at.toISOString(),
          update_at: mockCandidate.update_at.toISOString()
        }],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1
        }
      });

    expectLocal(getAllStub.calledOnceWith({
      page: 1,
      limit: 10,
      search: "John",
      status: "Applied",
      search_at: undefined,
      offer_date_from: undefined,
      offer_date_to: undefined,
      onboard_date_from: undefined,
      onboard_date_to: undefined,
      expected_onboard_date_from: undefined,
      expected_onboard_date_to: undefined,
      feedback_date_from: undefined,
      feedback_date_to: undefined,
      candidate_code: "",
      candidate_name: "",
      candidate_email: "",
      candidate_phone: "",
      agency: "",
      note: "",
      recruiter: "",
      job_code: "",
      project: "",
      platform: "",
      reference: "",
      company: ""
    })).to.be.true;
  });

  it("GET /candidate/search - should support search_at filter parameter", async () => {
    const mockCandidate = {
      candidate_id: 1,
      candidate_code: "CAND001",
      candidate_name: "John Doe",
      status: "Applied",
      create_at: new Date(),
      update_at: new Date()
    };
    const mockList = {
      items: [mockCandidate],
      total: 1
    };
    getAllStub.reset();
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/candidate/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ page: 1, limit: 10, search: "John", status: "Applied", "search_at[]": ["name", "email"] })
      .expectStatus(200);

    expectLocal(getAllStub.calledOnceWith({
      page: 1,
      limit: 10,
      search: "John",
      status: "Applied",
      search_at: ["name", "email"],
      offer_date_from: undefined,
      offer_date_to: undefined,
      onboard_date_from: undefined,
      onboard_date_to: undefined,
      expected_onboard_date_from: undefined,
      expected_onboard_date_to: undefined,
      feedback_date_from: undefined,
      feedback_date_to: undefined,
      candidate_code: "",
      candidate_name: "",
      candidate_email: "",
      candidate_phone: "",
      agency: "",
      note: "",
      recruiter: "",
      job_code: "",
      project: "",
      platform: "",
      reference: "",
      company: ""
    })).to.be.true;
  });

  it("GET /candidate - should get candidate by id", async () => {
    const mockCandidate = {
      candidate_id: 1,
      candidate_code: "CAND001",
      candidate_name: "John Doe",
      status: "Applied",
      create_at: new Date(),
      update_at: new Date()
    };
    getByIdStub.resolves(mockCandidate);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/candidate")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy thông tin ứng viên thành công",
        data: {
          ...mockCandidate,
          create_at: mockCandidate.create_at.toISOString(),
          update_at: mockCandidate.update_at.toISOString()
        }
      });

    expectLocal(getByIdStub.calledOnceWith(1)).to.be.true;
  });

  it("PUT /candidate - should update candidate successfully", async () => {
    const mockCandidate = {
      candidate_id: 1,
      candidate_name: "John Doe Updated",
      status: "Interviewing",
      create_at: new Date(),
      update_at: new Date()
    };
    updateStub.resolves(mockCandidate);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/candidate")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withMultiPartFormData({ candidate_name: "John Doe Updated" })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin ứng viên thành công",
        data: {
          ...mockCandidate,
          create_at: mockCandidate.create_at.toISOString(),
          update_at: mockCandidate.update_at.toISOString()
        }
      });

    expectLocal(updateStub.calledOnceWith(1, { candidate_name: "John Doe Updated" })).to.be.true;
  });

  it("PUT /candidate - should return 400 validation error for invalid dates", async () => {
    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/candidate")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withMultiPartFormData({
        onboard_date: "026-06-10"
      })
      .expectStatus(400)
      .expectJson({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Trường onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"]
      });
  });

  it("POST /candidate - should return 400 validation error for unknown fields", async () => {
    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/candidate")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData({
        candidate_name: "John Doe",
        status: "Applied",
        candidate_name_invalid: "Tran Minh Khoa Updated"
      })
      .expectStatus(400)
      .expectJson({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["candidate_name_invalid không được phép"]
      });
  });

  it("DELETE /candidate - should delete candidate successfully", async () => {
    deleteStub.resolves();

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .delete("/candidate")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Xóa ứng viên thành công"
      });

    expectLocal(deleteStub.calledOnceWith([1])).to.be.true;
  });
});
