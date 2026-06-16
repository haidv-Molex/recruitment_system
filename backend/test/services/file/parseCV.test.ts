import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import FileService from "@services/file/_File";
import fs from "fs";
import path from "path";
import sinon from "sinon";
import * as pdfParser from "@utilities/pdfParser";
import * as cohereClientHelper from "@utilities/cohereClient";
import mammoth from "mammoth";

describe("parseCV Service", () => {
  let client: PoolClient;
  let expect: any;
  const originalSavePath = process.env.PATH_SAVE_FILE;
  const testSavePath = "./test-uploads";

  before(async () => {
    // Dynamically import chai expect to handle ES Module compatibility
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
    process.env.PATH_SAVE_FILE = testSavePath;
  });

  after(() => {
    process.env.PATH_SAVE_FILE = originalSavePath;
    if (fs.existsSync(testSavePath)) {
      fs.rmSync(testSavePath, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
    sinon.restore();
  });

  it("should successfully parse a PDF CV file using Cohere API", async () => {
    // Stub pdfParser.parsePdf to return mock text content
    sinon.stub(pdfParser, "parsePdf").resolves({
      text: "CV Nguyen Van A. Software Engineer with Node.js and TypeScript skills.",
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: {},
      version: "default"
    });

    // Stub getCohereClient
    const mockCohereResponse = {
      message: {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: "Nguyen Van A",
              email: "anguyen@example.com",
              phone: "0901234567",
              skills: ["Node.js", "TypeScript"],
              languages: ["Vietnamese", "English"],
              experience_years: "3",
              education: "Bach Khoa University",
              current_position: "Software Engineer",
              work_experience: "Company X: Software Engineer (2020-2023) - Worked on Node.js backend."
            })
          }
        ]
      }
    };
    const chatStub = sinon.stub().resolves(mockCohereResponse);
    const cohereStub = sinon.stub(cohereClientHelper, "getCohereClient").returns({
      chat: chatStub
    } as any);

    // Create a mock PDF file on disk
    const type = "cv";
    const absoluteDir = path.join(testSavePath, type);
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }
    const tempFilePath = path.join(absoluteDir, "test_cv.pdf");
    fs.writeFileSync(tempFilePath, "dummy pdf buffer data");

    // Execute service
    const result = await FileService.parseCV(tempFilePath);

    expect(result).to.be.an("object");
    expect(result.name).to.equal("Nguyen Van A");
    expect(result.skills).to.include("Node.js");
    expect(cohereStub.calledOnce).to.be.true;
    expect(chatStub.calledOnce).to.be.true;

    // Clean up file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  it("should successfully parse a DOCX CV file using Cohere API", async () => {
    // Stub mammoth.extractRawText
    sinon.stub(mammoth, "extractRawText").resolves({
      value: "CV Tran Thi B. Product Manager with 5 years experience.",
      messages: []
    });

    // Stub getCohereClient
    const mockCohereResponse = {
      message: {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: "Tran Thi B",
              email: "btran@example.com",
              phone: "0912345678",
              skills: ["Product Management", "Agile"],
              languages: ["Vietnamese", "English"],
              experience_years: "5",
              education: "National Economics University",
              current_position: "Product Manager",
              work_experience: "Company Y: Product Manager (2018-2023) - Managed agile product teams."
            })
          }
        ]
      }
    };
    const chatStub = sinon.stub().resolves(mockCohereResponse);
    const cohereStub = sinon.stub(cohereClientHelper, "getCohereClient").returns({
      chat: chatStub
    } as any);

    // Create a mock DOCX file on disk
    const type = "cv";
    const absoluteDir = path.join(testSavePath, type);
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }
    const tempFilePath = path.join(absoluteDir, "test_cv.docx");
    fs.writeFileSync(tempFilePath, "dummy docx data");

    // Execute service
    const result = await FileService.parseCV(tempFilePath);

    expect(result).to.be.an("object");
    expect(result.name).to.equal("Tran Thi B");
    expect(result.experience_years).to.equal("5");
    expect(cohereStub.calledOnce).to.be.true;
    expect(chatStub.calledOnce).to.be.true;

    // Clean up file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  it("should throw an AppError if the file extension is unsupported", async () => {
    const tempFilePath = path.join(testSavePath, "test_cv.txt");
    if (!fs.existsSync(testSavePath)) {
      fs.mkdirSync(testSavePath, { recursive: true });
    }
    fs.writeFileSync(tempFilePath, "plain text content");

    try {
      await FileService.parseCV(tempFilePath);
      throw new Error("Should have thrown AppError");
    } catch (err: any) {
      expect(err).to.be.an.instanceOf(AppError);
      expect(err.statusCode).to.equal(400);
      expect(err.message).to.contain("Định dạng file không hỗ trợ");
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  it("should throw an AppError if text extraction yields empty content", async () => {
    sinon.stub(pdfParser, "parsePdf").resolves({
      text: "   ",
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: {},
      version: "default"
    });

    const tempFilePath = path.join(testSavePath, "empty_cv.pdf");
    if (!fs.existsSync(testSavePath)) {
      fs.mkdirSync(testSavePath, { recursive: true });
    }
    fs.writeFileSync(tempFilePath, "dummy");

    try {
      await FileService.parseCV(tempFilePath);
      throw new Error("Should have thrown AppError");
    } catch (err: any) {
      expect(err).to.be.an.instanceOf(AppError);
      expect(err.statusCode).to.equal(400);
      expect(err.message).to.contain("Nội dung tệp CV trống");
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  it("should handle Cohere API errors gracefully", async () => {
    sinon.stub(pdfParser, "parsePdf").resolves({
      text: "CV Nguyen Van A.",
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: {},
      version: "default"
    });

    const chatStub = sinon.stub().rejects(new Error("Cohere API is down"));
    sinon.stub(cohereClientHelper, "getCohereClient").returns({
      chat: chatStub
    } as any);

    const tempFilePath = path.join(testSavePath, "test_cv.pdf");
    if (!fs.existsSync(testSavePath)) {
      fs.mkdirSync(testSavePath, { recursive: true });
    }
    fs.writeFileSync(tempFilePath, "dummy");

    try {
      await FileService.parseCV(tempFilePath);
      throw new Error("Should have thrown AppError");
    } catch (err: any) {
      expect(err).to.be.an.instanceOf(AppError);
      expect(err.statusCode).to.equal(500);
      expect(err.message).to.contain("Lỗi khi phân tích CV bằng Cohere AI");
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});
