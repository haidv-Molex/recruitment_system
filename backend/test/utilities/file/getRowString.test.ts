import getRowString from "@utilities/file/getRowString";

describe("getRowString", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should trim string values", () => {
    expect(getRowString({ Name: "  Alice  " }, "Name")).to.equal("Alice");
  });

  it("should return null for nullish values by default", () => {
    expect(getRowString({ Name: null }, "Name")).to.be.null;
    expect(getRowString({}, "Missing")).to.be.null;
  });

  it("should use defaultValue for missing required fields", () => {
    expect(getRowString({}, "Name", { defaultValue: "" })).to.equal("");
  });

  it("should use emptyValue for trimmed empty strings", () => {
    expect(getRowString({ Note: "   " }, "Note", { emptyValue: "" })).to.equal("");
    expect(getRowString({ Note: "   " }, "Note")).to.be.null;
  });

  it("should preserve numeric-looking strings", () => {
    expect(getRowString({ Phone: "00123" }, "Phone")).to.equal("00123");
  });

  it("should stringify numeric values", () => {
    expect(getRowString({ Count: 123 }, "Count")).to.equal("123");
  });
});