import normalizeLookupKey from "@utilities/entity/normalizeLookupKey";

export function resolveEntity<T>(
  value: unknown,
  entityMap: Map<string, T>,
  createPlaceholder?: (name: string) => T
): T | null {
  if (value === null || value === undefined) return null;

  const name = String(value).trim();
  const key = normalizeLookupKey(name);
  if (!key) return null;

  return entityMap.get(key) ?? (createPlaceholder ? createPlaceholder(name) : null);
}

type ResolveEntitiesOptions = {
  splitPattern?: RegExp;
  preferFullMatch?: boolean;
};

export function resolveEntities<T>(
  value: unknown,
  entityMap: Map<string, T>,
  createPlaceholder?: (name: string) => T,
  options: ResolveEntitiesOptions = {}
): T[] {
  if (value === null || value === undefined) return [];

  const name = String(value).trim();
  if (!name) return [];

  const preferFullMatch = options.preferFullMatch ?? true;
  if (preferFullMatch) {
    const fullMatch = entityMap.get(normalizeLookupKey(name));
    if (fullMatch) return [fullMatch];
  }

  const splitPattern = options.splitPattern ?? /[,;\n\r]/;
  const parts = name.split(splitPattern).map((part) => part.trim()).filter(Boolean);
  const resolved: T[] = [];

  for (const part of parts) {
    const matched = entityMap.get(normalizeLookupKey(part));
    if (matched) {
      resolved.push(matched);
    } else if (createPlaceholder) {
      resolved.push(createPlaceholder(part));
    }
  }

  return resolved;
}
