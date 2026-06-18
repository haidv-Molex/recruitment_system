import buildDateRangeConditions from "@utilities/query/buildDateRangeConditions";

describe("buildDateRangeConditions", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should append from and to conditions using existing params length", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-01-31T00:00:00.000Z");
    const conditions = ["job_id = $1"];
    const params: any[] = [12];

    const result = buildDateRangeConditions({ from, to }, "j.request_date", conditions, params);

    expect(result.conditions).to.deep.equal([
      "job_id = $1",
      "j.request_date >= $2",
      "j.request_date <= $3"
    ]);
    expect(result.params).to.deep.equal([12, from, to]);
  });

  it("should not add conditions when range is empty", () => {
    const result = buildDateRangeConditions({}, "c.create_at");
    expect(result.conditions).to.deep.equal([]);
    expect(result.params).to.deep.equal([]);
  });

  it("should support strict operators", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-02-01T00:00:00.000Z");

    const result = buildDateRangeConditions(
      { from, to },
      "c.create_at",
      [],
      [],
      { fromOperator: ">", toOperator: "<" }
    );

    expect(result.conditions).to.deep.equal(["c.create_at > $1", "c.create_at < $2"]);
  });
});