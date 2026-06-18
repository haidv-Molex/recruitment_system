import "dotenv/config";
import fs from "fs";
import { mapCVParseResult } from "@services/file/parseCV";
import { parseCVByVendor } from "@utilities/cvParseClient";

describe("parseCV Service live CVParse integration", function () {
  let expect: any;
  const liveCVPath = process.env.LIVE_CV_PATH;
  const shouldRunLiveCVParseTests = process.env.RUN_LIVE_CVPARSE_TESTS === "true";
  let rawDataPromise: Promise<Record<string, unknown>> | null = null;

  this.timeout(120000);

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
  });

  beforeEach(function () {
    if (!shouldRunLiveCVParseTests) {
      this.skip();
    }

    if (!liveCVPath) {
      this.skip();
    }

    if (!fs.existsSync(liveCVPath)) {
      throw new Error(`LIVE_CV_PATH không tồn tại: ${liveCVPath}`);
    }
  });

  function getLiveRawData(): Promise<Record<string, unknown>> {
    if (!rawDataPromise) {
      rawDataPromise = parseCVByVendor(liveCVPath as string);
    }

    return rawDataPromise;
  }

  it("should print raw CVParse data for a real CV", async () => {
    const rawData = await getLiveRawData();

    console.log("CVPARSE_RAW_DATA_START");
    console.log(JSON.stringify(rawData, null, 2));
    console.log("CVPARSE_RAW_DATA_END");

    expect(rawData).to.be.an("object");
  });

  it("should map a real CVParse response to ParsedCV", async () => {
    const rawData = await getLiveRawData();
    const parsedCV = mapCVParseResult(rawData);

    console.log("PARSED_CV_START");
    console.log(JSON.stringify(parsedCV, null, 2));
    console.log("PARSED_CV_END");

    expect(parsedCV).to.be.an("object");
    expect(parsedCV).to.have.property("email");
    expect(parsedCV).to.have.property("skills").that.is.an("array");
  });
});