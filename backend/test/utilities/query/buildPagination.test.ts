import buildPagination from "@utilities/query/buildPagination";

describe("buildPagination", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should return default pagination when params are empty", () => {
    expect(buildPagination({})).to.deep.equal({
      unlimited: false,
      page: 1,
      limit: 10,
      offset: 0
    });
  });

  it("should calculate offset from page and limit", () => {
    expect(buildPagination({ page: 3, limit: 25 })).to.deep.equal({
      unlimited: false,
      page: 3,
      limit: 25,
      offset: 50
    });
  });

  it("should normalize invalid page and limit", () => {
    expect(buildPagination({ page: 0, limit: -1 })).to.deep.equal({
      unlimited: false,
      page: 1,
      limit: 10,
      offset: 0
    });
  });

  it("should preserve unlimited flag", () => {
    expect(buildPagination({ unlimited: true })).to.deep.equal({
      unlimited: true,
      page: 1,
      limit: 10,
      offset: 0
    });
  });
});