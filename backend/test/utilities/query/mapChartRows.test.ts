import mapChartRows from "@utilities/query/mapChartRows";

describe("mapChartRows", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should map default label and value fields", () => {
    const result = mapChartRows([{ label: "HR", value: 3 }]);
    expect(result).to.deep.equal([{ label: "HR", value: 3 }]);
  });

  it("should coerce numeric values", () => {
    const result = mapChartRows([{ label: "HR", value: "7" }]);
    expect(result).to.deep.equal([{ label: "HR", value: 7 }]);
  });

  it("should use a default label for empty labels", () => {
    const result = mapChartRows([{ label: "", value: 2 }], { defaultLabel: "N/A" });
    expect(result).to.deep.equal([{ label: "N/A", value: 2 }]);
  });

  it("should support custom field names", () => {
    const result = mapChartRows([{ name: "Platform", total: 4 }], {
      labelField: "name",
      valueField: "total"
    });
    expect(result).to.deep.equal([{ label: "Platform", value: 4 }]);
  });
});