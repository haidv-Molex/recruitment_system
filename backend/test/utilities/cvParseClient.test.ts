import sinon from "sinon";
import axios from "axios";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { parseCVByVendor } from "@utilities/cvParseClient";
import { AppError } from "@middlewares/AppError";

describe("cvParseClient utility", () => {
  let expect: any;
  const originalEnv = { ...process.env };
  const testDir = path.join(".test", "cvParseClient");
  const testFilePath = path.join(testDir, "sample.pdf");

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CVPARSE_BASE_URL = "https://cvparse.test";
    process.env.CVPARSE_API_KEY = "test-api-key";
    process.env.CVPARSE_USE_LOCAL_PROXY = "false";
    process.env.CVPARSE_MAX_RETRIES = "1";

    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testFilePath, "%PDF-1.4\ntest");
  });

  afterEach(() => {
    sinon.restore();
    process.env = { ...originalEnv };
    fs.rmSync(".test", { recursive: true, force: true });
  });

  it("should recreate multipart stream when upload request is retried", async () => {
    const networkError = Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
    const postStub = sinon.stub(axios, "post");
    const getStub = sinon.stub(axios, "get");
    const streamStub = sinon.stub(fs, "createReadStream");

    streamStub.onFirstCall().returns(Readable.from(["first upload"]) as any);
    streamStub.onSecondCall().returns(Readable.from(["second upload"]) as any);

    postStub.onFirstCall().rejects(networkError);
    postStub.onSecondCall().resolves({
      status: 202,
      data: { job_id: "job-1", status: "processing" },
    });

    getStub.onFirstCall().resolves({
      status: 200,
      data: { job_id: "job-1", status: "completed" },
    });
    getStub.onSecondCall().resolves({
      status: 200,
      data: { data: { full_name: "Jane Candidate" } },
    });

    const result = await parseCVByVendor(testFilePath);

    expect(result).to.deep.equal({ full_name: "Jane Candidate" });
    expect(postStub.callCount).to.equal(2);
    expect(streamStub.callCount).to.equal(2);

    const firstFormData = postStub.firstCall.args[1];
    const secondFormData = postStub.secondCall.args[1];
    expect(secondFormData).to.not.equal(firstFormData);
  });

  it("should throw AppError with vendor status and nested message", async () => {
    sinon.stub(fs, "createReadStream").returns(Readable.from(["upload"]) as any);
    sinon.stub(axios, "post").resolves({
      status: 401,
      data: {
        detail: {
          error: "unauthorized",
          message: "Invalid API key",
        },
      },
    });

    try {
      await parseCVByVendor(testFilePath);
      throw new Error("Should have thrown AppError");
    } catch (err: any) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(401);
      expect(err.message).to.equal("CVParse API lỗi: Invalid API key");
    }
  });
});
