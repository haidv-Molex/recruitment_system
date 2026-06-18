import quoteIdentifier from "@utilities/db/quoteIdentifier";

describe("quoteIdentifier", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should quote a valid identifier", () => {
    expect(quoteIdentifier("company_id")).to.equal("\"company_id\"");
  });

  it("should reject invalid identifiers", () => {
    expect(() => quoteIdentifier("company;DROP")).to.throw("Invalid SQL identifier");
  });
});