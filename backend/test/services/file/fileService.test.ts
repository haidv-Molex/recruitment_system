import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import FileService from "@services/file/_File";
import fs from "fs";
import path from "path";

describe("FileService", () => {
  let client: PoolClient;
  let expect: any;
  const originalSavePath = process.env.PATH_SAVE_FILE;
  const testSavePath = "./test-uploads";

  before(async () => {
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
  });

  it("should successfully upload a CV file", async () => {
    const fileData = {
      type: "cv" as const,
      originalname: "my_cv.pdf",
      buffer: Buffer.from("dummy pdf content")
    };

    const result = await FileService.upload(fileData, client);

    expect(result).to.have.property("file_id").that.is.a("number");
    expect(result.file_path).to.contain("cv/");
    expect(result.file_path).to.contain("_");
    expect(result.file_path).to.contain(".pdf");

    // Verify file actually written to disk
    const absolutePath = path.resolve(testSavePath, result.file_path);
    expect(fs.existsSync(absolutePath)).to.be.true;
    expect(fs.readFileSync(absolutePath).toString()).to.equal("dummy pdf content");
  });

  it("should successfully upload a JD file", async () => {
    const fileData = {
      type: "jd" as const,
      originalname: "job_description.docx",
      buffer: Buffer.from("dummy docx content")
    };

    const result = await FileService.upload(fileData, client);

    expect(result).to.have.property("file_id").that.is.a("number");
    expect(result.file_path).to.contain("jd/");
    expect(result.file_path).to.contain(".docx");

    const absolutePath = path.resolve(testSavePath, result.file_path);
    expect(fs.existsSync(absolutePath)).to.be.true;
  });

  it("should retrieve uploaded file by id", async () => {
    const fileData = {
      type: "cv" as const,
      originalname: "test.png",
      buffer: Buffer.from("dummy image content")
    };

    const uploaded = await FileService.upload(fileData, client);
    const retrieved = await FileService.getById(uploaded.file_id, client);

    expect(retrieved.file_id).to.equal(uploaded.file_id);
    expect(retrieved.file_path).to.equal(uploaded.file_path);
  });

  it("should throw AppError 404 when file does not exist in DB", async () => {
    try {
      await FileService.getById(99999, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
      expect((err as AppError).message).to.equal("Không tìm thấy thông tin file");
    }
  });
});
