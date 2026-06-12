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

describe("createValidationSheetController API", () => {
  let expectLocal: any;
  let poolConnectStub: sinon.SinonStub;
  let mockClient: any;
  let server: any;
  let port: number;
  let mockCurrentUser: any = null;

  // Stubs
  let findByIdStub: sinon.SinonStub;
  let checkUserBannedStub: sinon.SinonStub;
  let createValidationSheetStub: sinon.SinonStub;

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

    // File Service stub
    createValidationSheetStub = sinon.stub(FileService, "createValidationSheet");
  });

  afterEach(() => {
    poolConnectStub.restore();
    checkUserBannedStub.restore();
    findByIdStub.restore();
    createValidationSheetStub.restore();
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
      .get("/file/validation-sheet")
      .expectStatus(401);
  });

  it("should successfully return validation Excel file with correct headers", async () => {
    // Construct a mock workbook to be written to response stream
    const mockWorkbook = new ExcelJS.Workbook();
    const ws = mockWorkbook.addWorksheet("Data Validation");
    ws.getCell("A1").value = "Dept";
    ws.getCell("A2").value = "CA";

    createValidationSheetStub.resolves(mockWorkbook);

    const token = generateTestToken(1, "Test User");

    const response = await pactum.spec()
      .get("/file/validation-sheet")
      .withHeaders("Authorization", `Bearer ${token}`)
      .expectStatus(200)
      .expectHeader(
        "content-type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      .expectHeader(
        "content-disposition",
        'attachment; filename="dataValidation.xlsx"'
      );

    // Verify service was called once
    expectLocal(createValidationSheetStub.calledOnce).to.be.true;

    // Verify response body has data
    expectLocal(response.body).to.not.be.undefined;
  });
});
