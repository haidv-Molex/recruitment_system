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
import ExcelJS from "exceljs";
import FileController from "@controller/file/_FileController";
import FileService from "@services/file/_File";
import User from "@/services/user/_User";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";

describe("parseCandidateSheetController API", () => {
  let expectLocal: any;
  let poolConnectStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;
  let mockCurrentUser: any = null;

  let findByIdStub: sinon.SinonStub;
  let checkUserBannedStub: sinon.SinonStub;
  let parseCandidateSheetStub: sinon.SinonStub;

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

    checkUserBannedStub = sinon.stub(User, "checkUserBanned").resolves();
    mockCurrentUser = { user_id: 1, user_name: "Test User", user_role: "hr" };
    findByIdStub = sinon.stub(User, "findById").resolves(mockCurrentUser);

    parseCandidateSheetStub = sinon.stub(FileService, "parseCandidateSheet");
  });

  afterEach(() => {
    poolConnectStub.restore();
    checkUserBannedStub.restore();
    findByIdStub.restore();
    parseCandidateSheetStub.restore();
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

  async function createSampleWorkbookBuffer(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    const idlSheet = workbook.addWorksheet("IDL tracking");
    idlSheet.addRow([
      "Job Code",
      "Project",
      "Dept.",
      "HC Requested",
      "Job title",
      "EE Level",
      "Sites",
      "Project Segment",
      "Hiring manager",
      "HRBP",
      "Recruiter",
      "MyHR request date",
      "Expected onboard date",
      "Status",
      "CV Sent",
      "Interview",
      "Offered",
      "Offer Accepted",
      "Onboarded",
      "Offer Rejected",
      "Source",
      "Candidate Name",
      "Onboard Date",
      "Offer Date",
      "Note"
    ]);
    idlSheet.addRow(["J001", "DSS Talent Connector", "AS", 1, "Engineer", "Engineer"]);

    const databaseSheet = workbook.addWorksheet("Database");
    databaseSheet.addRow([
      "Input date (dd/mm/yyyy)",
      "Department",
      "Name",
      "Email",
      "Phone number",
      "Recruiter",
      "Job code",
      "Job title",
      "EE Level",
      "Project",
      "Hiring manager",
      "DL/IDL",
      "Status",
      "Onboarding Date (DD/MM/YYYY)",
      "Offer Sent date\n(DD/MM/YYYY)",
      "Source",
      "Mã nhân viên",
      "Người giới thiệu",
      "Bộ phận",
      "Note",
      "Current salary \n(Gross M VND)",
      "Expected salary\n(Gross M VND)",
      "Candidate result feedback date",
      "Headhunt Agency",
      "Targeted company",
      "Targeted company name"
    ]);
    databaseSheet.addRow([
      "2025-04-22",
      "AS",
      "Nguyễn Văn A",
      "nguyenvana@example.com",
      "0903442885",
      "Annie",
      "J001",
      "Engineer, Production",
      "Engineer",
      "DSS Talent Connector",
      "Nguyễn Lê Hoàng",
      "MXV",
      "CV Sent",
      null,
      null,
      "Vietnamworks Job Post",
      null,
      null,
      null,
      null,
      null,
      null,
      "2025-04-29",
      null,
      "No",
      null
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  it("should block request without authorization", async () => {
    await pactum.spec()
      .post("/file/parse-candidate-sheet")
      .withBody({ sheetData: [] })
      .expectStatus(401);
  });

  it("should successfully parse and return sheet data via JSON body", async () => {
    const mockOutput = [
      {
        candidate_name: "Nguyễn Văn A",
        candidate_email: "nguyenvana@example.com",
        status: "CV Sent"
      }
    ];
    parseCandidateSheetStub.resolves(mockOutput);

    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/file/parse-candidate-sheet")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withBody({
        sheetData: [
          {
            "Name": "Nguyễn Văn A",
            "Email": "nguyenvana@example.com",
            "Status": "CV Sent"
          }
        ]
      })
      .expectStatus(200)
      .expectJson({
        result: true,
        message: "Đọc và chuẩn hóa dữ liệu ứng viên thành công",
        data: mockOutput
      });

    expectLocal(parseCandidateSheetStub.calledOnce).to.be.true;
    expectLocal(parseCandidateSheetStub.firstCall.args[0]).to.deep.equal([
      {
        "Name": "Nguyễn Văn A",
        "Email": "nguyenvana@example.com",
        "Status": "CV Sent"
      }
    ]);
  });

  it("should select Database sheet instead of IDL tracking for uploaded sample workbook", async () => {
    parseCandidateSheetStub.resolves([
      {
        candidate_name: "Nguyễn Văn A",
        candidate_email: "nguyenvana@example.com",
        status: "CV Sent"
      }
    ]);

    const token = generateTestToken(1, "Test User");
    const workbookBuffer = await createSampleWorkbookBuffer();

    await pactum.spec()
      .post("/file/parse-candidate-sheet")
      .withHeaders("Authorization", `Bearer ${token}`)
      .withMultiPartFormData("file", workbookBuffer, {
        filename: "sample.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })
      .expectStatus(200);

    expectLocal(parseCandidateSheetStub.calledOnce).to.be.true;
    const rawRows = parseCandidateSheetStub.firstCall.args[0];
    expectLocal(rawRows).to.be.an("array").with.lengthOf(1);
    expectLocal(rawRows[0]).to.include({
      "Name": "Nguyễn Văn A",
      "Email": "nguyenvana@example.com",
      "Source": "Vietnamworks Job Post",
      "EE Level": "Engineer"
    });
    expectLocal(rawRows[0]).to.not.have.property("Job Code");
  });

  it("should reject request if input data is empty", async () => {
    const token = generateTestToken(1, "Test User");

    await pactum.spec()
      .post("/file/parse-candidate-sheet")
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
      .post("/file/parse-candidate-sheet")
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