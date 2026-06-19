export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^\+?\d+(?:\.\d+)*$/;

export const dateInputValue = (value: any) => (value ? String(value).slice(0, 10) : '');

export const parseJsonValue = (value: any) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const toStringList = (value: any): string[] => {
  const parsed = parseJsonValue(value);
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
  }
  if (typeof parsed === 'string') {
    return parsed
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const toObjectList = <T extends Record<string, any>>(value: any): T[] => {
  const parsed = parseJsonValue(value);
  return Array.isArray(parsed)
    ? parsed.filter((item) => item && typeof item === 'object')
    : [];
};

export const normalizeLinks = (value: any): string[] => {
  const parsed = parseJsonValue(value);
  if (Array.isArray(parsed) || typeof parsed === 'string') return toStringList(parsed);
  if (parsed && typeof parsed === 'object') {
    return [parsed.github, parsed.linkedin, parsed.portfolio, ...toStringList(parsed.other)]
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
  }
  return [];
};

export const hasAnyValue = (values: Array<string | boolean | string[]>) =>
  values.some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return Boolean(value.trim());
  });

export const getPlatformLabel = (platform: any) => platform?.platform_code || platform?.platform_name || '';

export const getLevelLabel = (level: any) =>
  level?.level_code || '';

export const hasInvalidOptionalNumber = (value: string) => {
  if (!String(value || '').trim()) return false;
  const numericValue = Number(value);
  return !Number.isFinite(numericValue) || numericValue < 0;
};