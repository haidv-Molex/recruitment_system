import type { LinkFormData } from './types';

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

export const normalizeLinks = (value: any): LinkFormData => {
  const parsed = parseJsonValue(value) || {};
  return {
    github: parsed.github || '',
    linkedin: parsed.linkedin || '',
    portfolio: parsed.portfolio || '',
    other: toStringList(parsed.other),
  };
};

export const hasAnyValue = (values: Array<string | boolean | string[]>) =>
  values.some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return Boolean(value.trim());
  });

export const getPlatformLabel = (platform: any) => platform?.platform_code || platform?.platform_name || '';

export const getLevelLabel = (level: any) =>
  [level?.level_code, level?.level_name].filter(Boolean).join(' - ') || '';

export const hasInvalidOptionalNumber = (value: string) => {
  if (!String(value || '').trim()) return false;
  const numericValue = Number(value);
  return !Number.isFinite(numericValue) || numericValue < 0;
};