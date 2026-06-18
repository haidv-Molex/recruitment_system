import normalizeLookupKey from "@utilities/entity/normalizeLookupKey";

type BuildEntityMapOptions = {
  duplicateStrategy?: "first" | "last";
};

export function buildEntityMap<T>(
  entities: Iterable<T>,
  getName: (entity: T) => unknown,
  options: BuildEntityMapOptions = {}
): Map<string, T> {
  const map = new Map<string, T>();
  const duplicateStrategy = options.duplicateStrategy ?? "first";

  for (const entity of entities) {
    const key = normalizeLookupKey(getName(entity));
    if (key && (duplicateStrategy === "last" || !map.has(key))) {
      map.set(key, entity);
    }
  }

  return map;
}

export default buildEntityMap;