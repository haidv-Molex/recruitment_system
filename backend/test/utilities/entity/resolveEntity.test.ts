import { resolveEntity, resolveEntities } from "@utilities/entity/resolveEntity";

describe("resolveEntity", () => {
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  it("should resolve a single entity by case-insensitive name", () => {
    const entity = { id: 1, name: "Annie" };
    const map = new Map([["annie", entity]]);

    expect(resolveEntity(" ANNIE ", map)).to.equal(entity);
  });

  it("should return placeholder for missing single entity when provided", () => {
    const result = resolveEntity("Unknown", new Map(), (name) => ({ id: null, name }));

    expect(result).to.deep.equal({ id: null, name: "Unknown" });
  });

  it("should resolve multiple entities with placeholders", () => {
    const annie = { id: 1, name: "Annie" };
    const map = new Map([["annie", annie]]);
    const result = resolveEntities("Annie, Missing", map, (name) => ({ id: null, name }));

    expect(result).to.deep.equal([annie, { id: null, name: "Missing" }]);
  });

  it("should prefer a full match before splitting", () => {
    const full = { id: 1, name: "A, B" };
    const map = new Map([["a, b", full]]);

    expect(resolveEntities("A, B", map)).to.deep.equal([full]);
  });
});