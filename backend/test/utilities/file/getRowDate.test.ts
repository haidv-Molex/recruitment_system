import getRowDate from "@utilities/file/getRowDate";

describe("getRowDate", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should return null for nullish or empty values", () => {
    expect(getRowDate({ Date: null }, "Date")).to.be.null;
    expect(getRowDate({}, "Date")).to.be.null;
    expect(getRowDate({ Date: "   " }, "Date")).to.be.null;
  });

  it("should convert string values to Date", () => {
    const result = getRowDate({ Date: "2026-06-18T00:00:00.000Z" }, "Date");
    expect(result).to.be.instanceOf(Date);
    expect(result!.toISOString()).to.equal("2026-06-18T00:00:00.000Z");
  });

  it("should keep Date instances", () => {
    const date = new Date("2026-06-18T00:00:00.000Z");
    expect(getRowDate({ Date: date }, "Date")).to.equal(date);
  });

  it("should return null for invalid dates when validate is true", () => {
    expect(getRowDate({ Date: "not-a-date" }, "Date", { validate: true })).to.be.null;
  });

  it("should preserve invalid Date objects when validate is false", () => {
    const result = getRowDate({ Date: "not-a-date" }, "Date");
    expect(result).to.be.instanceOf(Date);
    expect(Number.isNaN(result!.getTime())).to.be.true;
  });
});