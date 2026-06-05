import Joi, { ObjectSchema, AnySchema } from "joi";
import express, { RequestHandler } from "express";
import logger from "@middlewares/logger";

function applySafeString(schema: Joi.AnySchema): Joi.AnySchema {
  const s: any = schema; // cast sang any để đọc private fields

  // gài max tối đa text đầu vào là 1000
  if (s.type === "string") {
    const hasMax = (s._rules || []).some((r: any) => r.name === "max");
    if (!hasMax) {
      return (schema as Joi.StringSchema).max(1000);
    }
  }

  if (s.type === "object") {
    const keys: Record<string, Joi.AnySchema> = {};

    // _ids._byKey là Map, duyệt đúng cách
    if (s._ids && s._ids._byKey instanceof Map) {
      for (const [k, v] of s._ids._byKey.entries()) {
        keys[k] = applySafeString((v as any).schema);
      }
    }

    return (schema as Joi.ObjectSchema).keys(keys);
  }

  if (s.type === "array" && s._inner?.items) {
    const items = s._inner.items.map((i: any) => applySafeString(i));
    return (schema as Joi.ArraySchema).items(...items);
  }

  return schema;
}

function joiValidate(
  schema: ObjectSchema,
  property: "body" | "query" | "params" = "body"
): RequestHandler {
  return (req, res, next) => {
    const safeSchema = applySafeString(schema);

    const { error, value } = safeSchema.validate(req[property], {
      abortEarly: false,
      convert: true,
      errors: {
        label: "key",
        wrap: { label: false }, // bỏ dấu ngoặc kép quanh tên field
      },
      messages: {
        "any.required": "{{#label}} là bắt buộc",
        "string.base": "{{#label}} phải là chuỗi",
        "string.min": "{{#label}} phải có ít nhất {{#limit}} ký tự",
        "string.max": "{{#label}} không được vượt quá {{#limit}} ký tự",
        "number.base": "{{#label}} phải là số",
        "number.min": "{{#label}} phải >= {{#limit}}",
        "number.max": "{{#label}} phải <= {{#limit}}",
        "array.base": "{{#label}} phải là một mảng",
        "array.min": "{{#label}} phải có ít nhất {{#limit}} phần tử",
        "array.max": "{{#label}} không được vượt quá {{#limit}} phần tử",
        "any.invalid": "{{#label}} không hợp lệ",
      },
    });

    if (error) {
      logger.error("Validation error", { details: error.details });
      return res.status(400).json({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: error.details.map((d) => d.message),
      });
    }

    if (property === "query") {
      Object.defineProperty(req, "query", {
        value,
        writable: true,
        configurable: true,
      });
    } else {
      req[property] = value;
    }
    next();
  };
}

export default joiValidate;