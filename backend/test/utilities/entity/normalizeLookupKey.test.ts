import normalizeLookupKey from "@utilities/entity/normalizeLookupKey";

describe("normalizeLookupKey", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should trim and lowercase string values", () => {
    expect(normalizeLookupKey("  Nguyen Van A  ")).to.equal("nguyen van a");
  });

  it("should return an empty string for nullish values", () => {
    expect(normalizeLookupKey(null)).to.equal("");
    expect(normalizeLookupKey(undefined)).to.equal("");
  });

  it("should stringify non-string values", () => {
    expect(normalizeLookupKey(123)).to.equal("123");
  });
});