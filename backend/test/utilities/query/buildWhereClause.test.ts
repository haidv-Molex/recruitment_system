import buildWhereClause from "@utilities/query/buildWhereClause";

describe("buildWhereClause", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should return an empty string when no conditions are provided", () => {
    expect(buildWhereClause([])).to.equal("");
  });

  it("should join conditions with AND", () => {
    expect(buildWhereClause(["a = $1", "b = $2"])).to.equal("WHERE a = $1 AND b = $2");
  });

  it("should ignore blank conditions", () => {
    expect(buildWhereClause([" a = $1 ", "", "  "])).to.equal("WHERE a = $1");
  });

  it("should support a custom keyword", () => {
    expect(buildWhereClause(["a = $1"], "HAVING")).to.equal("HAVING a = $1");
  });
});