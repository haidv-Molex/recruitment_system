import Joi from "joi";
import { candidateDetailWriteFields } from "@services/candidate_detail/types";

const emptyNullable = ["", "null"];

const nullableString = (max?: number) => {
  const schema = Joi.string().empty(emptyNullable).allow(null);
  return max ? schema.max(max) : schema;
};

const nullableDate = () => Joi.date().iso().empty(emptyNullable).allow(null).messages({
  "date.format": "Trường ngày phải đúng định dạng YYYY-MM-DD hoặc ISO",
  "date.base": "Trường ngày phải đúng định dạng YYYY-MM-DD hoặc ISO"
});

const nullableNumber = () => Joi.number().precision(2).empty(emptyNullable).allow(null);

const stringArray = (withDefault: boolean) => {
  const schema = Joi.array().items(Joi.string().max(1000));
  return withDefault ? schema.default([]) : schema.optional();
};

const linksSchema = (withDefault: boolean) => {
  const schema = Joi.object({
    github: Joi.string().max(1000).allow("").default(""),
    linkedin: Joi.string().max(1000).allow("").default(""),
    portfolio: Joi.string().max(1000).allow("").default(""),
    other: Joi.array().items(Joi.string().max(1000)).default([])
  });

  return withDefault
    ? schema.default({ github: "", linkedin: "", portfolio: "", other: [] })
    : schema.optional();
};

const languageDetailSchema = Joi.object({
  language: Joi.string().max(255).allow("").default(""),
  proficiency: Joi.string().max(255).allow("").default("")
});

const educationDetailSchema = Joi.object({
  institution: Joi.string().max(255).allow("").default(""),
  degree: Joi.string().max(255).allow("").default(""),
  field: Joi.string().max(255).allow("").default(""),
  start_date: Joi.string().max(50).allow("").default(""),
  end_date: Joi.string().max(50).allow("").default("")
});

const workExperienceDetailSchema = Joi.object({
  title: Joi.string().max(255).allow("").default(""),
  company: Joi.string().max(255).allow("").default(""),
  start_date: Joi.string().max(50).allow("").default(""),
  end_date: Joi.string().max(50).allow("").default(""),
  is_current: Joi.boolean().default(false),
  responsibilities: Joi.array().items(Joi.string().max(1000)).default([])
});

const objectArray = (itemSchema: Joi.ObjectSchema, withDefault: boolean) => {
  const schema = Joi.array().items(itemSchema);
  return withDefault ? schema.default([]) : schema.optional();
};

function bodyFields(withDefaults: boolean) {
  return {
    summary: nullableString().optional(),
    date_of_birth: nullableDate().optional(),
    gender: Joi.string().valid("male", "female").empty(emptyNullable).allow(null).optional(),
    marital_status: Joi.string().valid("single", "married").empty(emptyNullable).allow(null).optional(),
    nationality: nullableString(100).optional(),
    location: nullableString(255).optional(),
    address: nullableString().optional(),
    links: linksSchema(withDefaults),
    skills: stringArray(withDefaults),
    languages: stringArray(withDefaults),
    language_details: objectArray(languageDetailSchema, withDefaults),
    education: nullableString().optional(),
    education_details: objectArray(educationDetailSchema, withDefaults),
    experience_years: nullableString(50).optional(),
    current_position: nullableString(255).optional(),
    current_level: nullableString(100).optional(),
    current_salary: nullableNumber().optional(),
    last_company: nullableString(255).optional(),
    work_experience: nullableString().optional(),
    work_experience_details: objectArray(workExperienceDetailSchema, withDefaults),
    certifications: stringArray(withDefaults),
    expected_position: nullableString(255).optional(),
    expected_level: nullableString(100).optional(),
    expected_salary: nullableNumber().optional(),
    expected_work_location: nullableString(255).optional(),
    offer_date: nullableDate().optional(),
    expected_onboard_date: nullableDate().optional(),
    onboard_date: nullableDate().optional(),
    feedback_date: nullableDate().optional(),
    salary_currency: withDefaults
      ? Joi.string().max(10).empty(emptyNullable).default("VND")
      : Joi.string().max(10).empty(emptyNullable).optional(),
    file_id: Joi.number().integer().empty(emptyNullable).allow(null).optional(),
    targeted_company: Joi.number().integer().empty(emptyNullable).allow(null).optional()
  };
}

export const createBodySchema = Joi.object(bodyFields(true));

export const updateBodySchema = Joi.object(bodyFields(false))
  .or(...candidateDetailWriteFields)
  .messages({
    "object.missing": "Phải cung cấp ít nhất một trường để cập nhật chi tiết ứng viên"
  });

export const idQuerySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã chi tiết ứng viên phải là số",
    "number.integer": "Mã chi tiết ứng viên phải là số nguyên",
    "number.positive": "Mã chi tiết ứng viên phải là số dương",
    "any.required": "Mã chi tiết ứng viên là bắt buộc"
  })
});

export const deleteQuerySchema = Joi.object({
  id: Joi.number().integer().positive().optional().messages({
    "number.base": "Mã chi tiết ứng viên phải là số",
    "number.integer": "Mã chi tiết ứng viên phải là số nguyên",
    "number.positive": "Mã chi tiết ứng viên phải là số dương"
  }),
  ids: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.number().integer().positive())
  ).optional().messages({
    "any.only": "Danh sách mã chi tiết ứng viên không hợp lệ"
  })
}).or("id", "ids");

export const searchQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).optional().default(10),
  unlimited: Joi.boolean().optional().default(false),
  search: Joi.string().optional().allow("").max(255),
  summary: Joi.string().optional().allow("").max(255),
  date_of_birth: Joi.string().optional().allow("").max(50),
  gender: Joi.string().valid("male", "female", "").optional().allow(""),
  marital_status: Joi.string().valid("single", "married", "").optional().allow(""),
  nationality: Joi.string().optional().allow("").max(100),
  location: Joi.string().optional().allow("").max(255),
  address: Joi.string().optional().allow("").max(255),
  links: Joi.string().optional().allow("").max(255),
  skills: Joi.string().optional().allow("").max(255),
  languages: Joi.string().optional().allow("").max(255),
  language_details: Joi.string().optional().allow("").max(255),
  education: Joi.string().optional().allow("").max(255),
  education_details: Joi.string().optional().allow("").max(255),
  experience_years: Joi.string().optional().allow("").max(50),
  current_position: Joi.string().optional().allow("").max(255),
  current_level: Joi.string().optional().allow("").max(100),
  current_salary: Joi.string().optional().allow("").max(50),
  last_company: Joi.string().optional().allow("").max(255),
  work_experience: Joi.string().optional().allow("").max(255),
  work_experience_details: Joi.string().optional().allow("").max(255),
  certifications: Joi.string().optional().allow("").max(255),
  expected_position: Joi.string().optional().allow("").max(255),
  expected_level: Joi.string().optional().allow("").max(100),
  expected_salary: Joi.string().optional().allow("").max(50),
  expected_work_location: Joi.string().optional().allow("").max(255),
  offer_date: Joi.string().optional().allow("").max(50),
  expected_onboard_date: Joi.string().optional().allow("").max(50),
  onboard_date: Joi.string().optional().allow("").max(50),
  feedback_date: Joi.string().optional().allow("").max(50),
  salary_currency: Joi.string().optional().allow("").max(10),
  targeted_company: Joi.string().optional().allow("").max(255)
});