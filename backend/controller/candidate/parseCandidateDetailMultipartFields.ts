import type { RequestHandler } from "express";

const stringArrayFields = ["skills", "languages", "certifications"];
const objectFields = ["links"];
const objectArrayFields = ["language_details", "education_details", "work_experience_details"];

const parseJson = (value: any, fallback: any) => {
  if (value === undefined || value === null || value === "" || value === "null") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseStringArray = (value: any) => {
  if (value === undefined || value === null || value === "" || value === "null") return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== "string") return [];

  const parsed = parseJson(value, null);
  if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const hasOwn = (body: any, field: string) => Object.prototype.hasOwnProperty.call(body, field);

const parseCandidateDetailMultipartFields: RequestHandler = (req, _res, next) => {
  const body = req.body || {};

  stringArrayFields.forEach((field) => {
    if (hasOwn(body, field)) body[field] = parseStringArray(body[field]);
  });

  objectFields.forEach((field) => {
    if (hasOwn(body, field)) body[field] = parseJson(body[field], {});
  });

  objectArrayFields.forEach((field) => {
    if (hasOwn(body, field)) body[field] = parseJson(body[field], []);
  });

  req.body = body;
  next();
};

export default parseCandidateDetailMultipartFields;