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
import FileController from "@controller/file/_FileController";
import FileService from "@services/file/_File";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("parseJobSheetController API", () => {
  let expectLocal: any;
  let poolConnectStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;
  let mockCurrentUser: any = null;

  // Stubs
  let findByIdStub: sinon.SinonStub;
  let checkUserBannedStub: sinon.SinonStub;
  let parseJobSheetStub: sinon.SinonStub;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expectLocal = localExpect;

    const app = express();
    app.use(express.json());
    app.use(passport.initialize());
    app.use("/file", FileController);
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

    // File parse stub
    parseJobSheetStub = sinon.stub(FileService, "parseJobSheet");
  });

  afterEach(() => {
    poolConnectStub.restore();
    checkUserBannedStub.restore();
    findByIdStub.restore();
    parseJobSheetStub.restore();
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

  it("should block request without authorization", async () => {
    await pactum.spec()
      .post("/file/parse-job-sheet")
      .withBody({ sheetData: [] })
      .expectStatus(401);
  });

  it("should successfully parse and return sheet data via JSON body", async () => {
    const mockOutput = [
      {
        job_code: "J001",
        project: "DSS Talent Connector",
        candidate_required: 1,
        note: null,
        file: null,
        partners: [],
        departments: [],
        segments: [],
        sites: [],
        titles: [],
        managers: [],
        employee_levels: []
      }
    ];
    parseJobSheetStub.resolves(mockOutput);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/file/parse-job-sheet")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withBody({
        sheetData: [
          {
            "Job Code": "J001",
            "Project": "DSS Talent Connector"
          }
        ]
      })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Đọc và chuẩn hóa dữ liệu sheet thành công",
        data: mockOutput
      });

    expectLocal(parseJobSheetStub.calledOnce).to.be.true;
    expectLocal(parseJobSheetStub.firstCall.args[0]).to.deep.equal([
      {
        "Job Code": "J001",
        "Project": "DSS Talent Connector"
      }
    ]);
  });

  it("should reject request if input data is empty", async () => {
    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/file/parse-job-sheet")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withBody({
        sheetData: []
      })
      .expectStatus(400)
      .expectJson({
        result: false,
        message: "Dữ liệu sheet rỗng hoặc không hợp lệ",
        type: "AppError"
      });
  });

  it("should reject invalid file format uploaded", async () => {
    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/file/parse-job-sheet")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData("file", Buffer.from("dummy txt content"), {
        filename: "test.txt",
        contentType: "text/plain"
      })
      .expectStatus(400)
      .expectJson({
        result: false,
        message: "Định dạng file không hỗ trợ. Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV (.csv)",
        type: "AppError"
      });
  });
});
