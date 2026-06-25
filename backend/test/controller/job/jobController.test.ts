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
import JobController from "@controller/job/_JobController";
import Job from "@services/job/_Job";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("JobController API", () => {
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
  let createWithAllStub: sinon.SinonStub;
  let batchImportStub: sinon.SinonStub;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expectLocal = localExpect;

    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/job", JobController);
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

    // Job stubs
    createStub = sinon.stub(Job, "create");
    getAllStub = sinon.stub(Job, "getAll");
    getByIdStub = sinon.stub(Job, "getById");
    updateStub = sinon.stub(Job, "update");
    deleteStub = sinon.stub(Job, "delete");
    createWithAllStub = sinon.stub(Job, "createWithAll");
    batchImportStub = sinon.stub(Job, "batchImport");
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
    createWithAllStub.restore();
    batchImportStub.restore();
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

  it("POST /job - should create job successfully with multipart and relation arrays", async () => {
    const mockJob = {
      job_id: 1,
      job_code: "JOB001",
      project: "Project X",
      note: "Urgent",
      request_date: new Date("2026-06-11"),
      create_at: new Date(),
      update_at: new Date(),
      file_id: 2,
      file: {
        file_id: 2,
        file_path: "jd/20260609_1.pdf",
        file_url: "http://localhost:3000/file/jd/20260609_1.pdf"
      }
    };
    createStub.resolves(mockJob);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/job")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData({
        job_code: "JOB001",
        project: "Project X",
        note: "Urgent",
        request_date: "2026-06-11",
        departments: '[{"department_id":3,"candidate_required":5},{"department_id":4,"candidate_required":2}]'
      })
      .withMultiPartFormData("file", Buffer.from("dummy pdf content"), {
        filename: "jd.pdf",
        contentType: "application/pdf"
      })
      .expectStatus(201)
      .expectJson({
        result: true,
        message: "Tạo công việc thành công",
        data: {
          ...mockJob,
          request_date: mockJob.request_date.toISOString(),
          create_at: mockJob.create_at.toISOString(),
          update_at: mockJob.update_at.toISOString()
        }
      });

    expectLocal(createStub.calledOnce).to.be.true;
    const args = createStub.firstCall.args[0];
    expectLocal(args.job_code).to.equal("JOB001");
    expectLocal(args.project).to.equal("Project X");
    expectLocal(args.request_date.toISOString().slice(0, 10)).to.equal("2026-06-11");
    expectLocal(args.departments).to.deep.equal([{ department_id: 3, candidate_required: 5 }, { department_id: 4, candidate_required: 2 }]);
    expectLocal(args.file).to.not.be.null;
    expectLocal(args.file.originalname).to.equal("jd.pdf");
  });

  it("POST /job - should allow missing job_code for auto generation", async () => {
    const mockJob = {
      job_id: 7,
      job_code: "J007",
      project: "Project Auto Code",
      create_at: new Date(),
      update_at: new Date(),
      file: null
    };
    createStub.resolves(mockJob);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/job")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData({
        project: "Project Auto Code",
      })
      .expectStatus(201)
      .expectJsonLike({
        result: true,
        message: "Tạo công việc thành công",
        data: {
          job_code: "J007",
          project: "Project Auto Code",
        }
      });

    expectLocal(createStub.calledOnce).to.be.true;
    const args = createStub.firstCall.args[0];
    expectLocal(args.job_code).to.be.null;
    expectLocal(args.project).to.equal("Project Auto Code");
  });

  it("POST /job - should allow missing or null project", async () => {
    const mockJob = {
      job_id: 8,
      job_code: "J008",
      project: null,
      create_at: new Date(),
      update_at: new Date(),
      file: null
    };
    createStub.resolves(mockJob);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/job")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData({
        job_code: "J008",
      })
      .expectStatus(201)
      .expectJsonLike({
        result: true,
        message: "Tạo công việc thành công",
        data: {
          job_code: "J008",
          project: null,
        }
      });

    expectLocal(createStub.calledOnce).to.be.true;
    const args = createStub.firstCall.args[0];
    expectLocal(args.job_code).to.equal("J008");
    expectLocal(args.project).to.be.null;
  });

  it("POST /job - should reject unsupported partners field", async () => {
    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/job")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData({
        job_code: "JOB001",
        project: "Project X",
        partners: "[1,2]",
      })
      .expectStatus(400)
      .expectJson({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["partners không được phép"]
      });

    expectLocal(createStub.notCalled).to.be.true;
  });

  it("POST /job/extended - should accept partners and partners_name", async () => {
    const mockJob = {
      job_id: 1,
      job_code: "JOB001",
      project: "Project X",
      create_at: new Date(),
      update_at: new Date(),
      file: null
    };
    createWithAllStub.resolves(mockJob);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/job/extended")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData({
        job_code: "JOB001",
        project: "Project X",
        partners: "[1]",
        partners_name: '["HRBP A"]',
      })
      .expectStatus(201)
      .expectJsonLike({
        result: true,
        message: "Tạo công việc thành công",
      });

    expectLocal(createWithAllStub.calledOnce).to.be.true;
    expectLocal(createWithAllStub.firstCall.args[0].partners).to.deep.equal([1]);
    expectLocal(createWithAllStub.firstCall.args[0].partners_name).to.deep.equal(["HRBP A"]);
  });

  it("GET /job/search - should get all jobs successfully", async () => {
    const mockJob = {
      job_id: 1,
      job_code: "JOB001",
      project: "Project X",
      note: "Urgent",
      create_at: new Date(),
      update_at: new Date(),
      file_id: null,
      file: null
    };
    const mockList = {
      items: [mockJob],
      total: 1
    };
    getAllStub.resolves(mockList);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/job/search")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ page: 1, limit: 10 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy danh sách công việc thành công",
        data: [{
          ...mockJob,
          create_at: mockJob.create_at.toISOString(),
          update_at: mockJob.update_at.toISOString()
        }],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1,
          limit: 10
        }
      });

    expectLocal(getAllStub.calledOnce).to.be.true;
  });

  it("GET /job - should get job by id", async () => {
    const mockJob = {
      job_id: 1,
      job_code: "JOB001",
      project: "Project X",
      note: "Urgent",
      create_at: new Date(),
      update_at: new Date(),
      file_id: 2,
      file: {
        file_id: 2,
        file_path: "jd/test.pdf",
        file_url: "http://localhost:3000/file/jd/test.pdf"
      }
    };
    getByIdStub.resolves(mockJob);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .get("/job")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Lấy thông tin công việc thành công",
        data: {
          ...mockJob,
          create_at: mockJob.create_at.toISOString(),
          update_at: mockJob.update_at.toISOString()
        }
      });

    expectLocal(getByIdStub.calledOnceWith(1)).to.be.true;
  });

  it("PUT /job - should update job successfully", async () => {
    const mockJob = {
      job_id: 1,
      job_code: "JOB001_NEW",
      project: "Project X",
      note: "Urgent",
      request_date: new Date("2026-06-12"),
      create_at: new Date(),
      update_at: new Date(),
      file_id: null,
      file: null
    };
    updateStub.resolves(mockJob);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/job")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withMultiPartFormData({ job_code: "JOB001_NEW", request_date: "2026-06-12", recruiter_name: "New Recruiter" })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Cập nhật thông tin công việc thành công",
        data: {
          ...mockJob,
          request_date: mockJob.request_date.toISOString(),
          create_at: mockJob.create_at.toISOString(),
          update_at: mockJob.update_at.toISOString()
        }
      });

    expectLocal(updateStub.calledOnce).to.be.true;
    const updateArgs = updateStub.firstCall.args[1];
    expectLocal(updateArgs.job_code).to.equal("JOB001_NEW");
    expectLocal(updateArgs.recruiter_name).to.equal("New Recruiter");
    expectLocal(new Date(updateArgs.request_date).toISOString().slice(0, 10)).to.equal("2026-06-12");
    expectLocal(updateArgs.updater_id).to.equal(1);
  });

  it("PUT /job - should reject unsupported partners_name field", async () => {
    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .put("/job")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .withMultiPartFormData({
        partners_name: '["HRBP A"]',
      })
      .expectStatus(400)
      .expectJson({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["partners_name không được phép"]
      });

    expectLocal(updateStub.notCalled).to.be.true;
  });

  it("DELETE /job - should delete job successfully", async () => {
    deleteStub.resolves();

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .delete("/job")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withQueryParams({ id: 1 })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Xóa công việc thành công"
      });

    expectLocal(deleteStub.calledOnce).to.be.true;
    expectLocal(deleteStub.firstCall.args[0]).to.deep.equal([1]);
  });

  it("POST /job/batch - should keep ordered HRBP and department payload", async () => {
    const mockResult = { success: true, importedCount: 1, errors: [] };
    batchImportStub.resolves(mockResult);

    const token = generateTestToken(1, "Test User");
    const jobs = [
      {
        job_code: "JOB001",
        project: "Project X",
        partners_name: ["HRBP A", "HRBP B"],
        departments_name: [
          { name: "Dept A", candidate_required: 1, partner_name: "HRBP A" },
          { name: "Dept B", candidate_required: 2, partner_name: "HRBP B" }
        ]
      }
    ];

    await pactum.spec()
      .post("/job/batch")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withJson({ jobs })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Thực hiện import loạt thành công",
        data: mockResult,
      });

    expectLocal(batchImportStub.calledOnce).to.be.true;
    const args = batchImportStub.firstCall.args[0];
    expectLocal(args).to.be.an("array").with.lengthOf(1);
    expectLocal(args[0].job_code).to.equal("JOB001");
    expectLocal(args[0].project).to.equal("Project X");
    expectLocal(args[0].partners_name).to.deep.equal(["HRBP A", "HRBP B"]);
    expectLocal(args[0].departments_name).to.deep.equal(jobs[0].departments_name);
  });
});
