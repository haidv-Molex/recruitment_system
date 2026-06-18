import buildEntityMap from "@utilities/entity/buildEntityMap";

describe("buildEntityMap", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should build a lowercase trimmed lookup map", () => {
    const first = { id: 1, name: " Annie " };
    const second = { id: 2, name: "Bob" };
    const map = buildEntityMap([first, second], (entity) => entity.name);

    expect(map.get("annie")).to.equal(first);
    expect(map.get("bob")).to.equal(second);
  });

  it("should keep the first entity when duplicate names exist", () => {
    const first = { id: 1, name: "Annie" };
    const second = { id: 2, name: "annie" };
    const map = buildEntityMap([first, second], (entity) => entity.name);

    expect(map.get("annie")).to.equal(first);
  });

  it("should keep the last entity when duplicateStrategy is last", () => {
    const first = { id: 1, name: "Annie" };
    const second = { id: 2, name: "annie" };
    const map = buildEntityMap([first, second], (entity) => entity.name, { duplicateStrategy: "last" });

    expect(map.get("annie")).to.equal(second);
  });

  it("should ignore empty keys", () => {
    const map = buildEntityMap([{ id: 1, name: "" }], (entity) => entity.name);
    expect(map.size).to.equal(0);
  });
});