import { AppError } from "@middlewares/AppError";
import assertFirstRow from "@utilities/db/assertFirstRow";

describe("assertFirstRow", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should return first row when rows exist", () => {
    const row = { id: 1 };
    expect(assertFirstRow([row], "missing")).to.equal(row);
  });

  it("should throw AppError when no rows exist", () => {
    try {
      assertFirstRow([], "missing row", 500);
      expect.fail("Expected assertFirstRow to throw");
    } catch (error) {
      expect(error).to.be.instanceOf(AppError);
      expect((error as AppError).message).to.equal("missing row");
      expect((error as AppError).statusCode).to.equal(500);
    }
  });
});