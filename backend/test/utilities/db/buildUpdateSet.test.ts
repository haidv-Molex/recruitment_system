import buildUpdateSet from "@utilities/db/buildUpdateSet";

describe("buildUpdateSet", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should build set clauses and values for defined fields", () => {
    const result = buildUpdateSet([
      { column: "company_name", value: "Molex" },
      { column: "company_description", value: null },
      { column: "ignored", value: undefined }
    ]);

    expect(result.setClauses).to.deep.equal(["\"company_name\" = $1", "\"company_description\" = $2"]);
    expect(result.values).to.deep.equal(["Molex", null]);
    expect(result.nextIndex).to.equal(3);
  });

  it("should respect startIndex", () => {
    const result = buildUpdateSet([{ column: "name", value: "A" }], 3);
    expect(result.setClauses).to.deep.equal(["\"name\" = $3"]);
    expect(result.nextIndex).to.equal(4);
  });
});