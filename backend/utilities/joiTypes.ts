import Joi from "joi";

/**
 * Custom Joi type: parse string/JSON-string/comma-separated/bracket-notation sang number[].
 * Dùng cho multipart/form-data vì mọi field đều đến dưới dạng string.
 *
 * Các định dạng được hỗ trợ:
 *   "[1,2,3]"   → [1, 2, 3]   (JSON array string)
 *   "1,2,3"     → [1, 2, 3]   (comma-separated)
 *   [1, 2, 3]   → [1, 2, 3]   (array thực sự)
 *   ""          → []           (chuỗi rỗng)
 */
export const numberArray = () =>
  Joi.custom((value, helpers) => {
    if (value === undefined || value === null || value === "") return [];
    if (Array.isArray(value)) {
      const parsed = value.map((v: any) => parseInt(v, 10));
      if (parsed.some(isNaN)) return helpers.error("any.invalid");
      return parsed;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            const nums = parsed.map((v: any) => parseInt(v, 10));
            if (nums.some(isNaN)) return helpers.error("any.invalid");
            return nums;
          }
        } catch (_) {
          // Bracket notation không phải JSON: "[1, 2, 3]"
          const inner = trimmed.slice(1, -1);
          const nums = inner.split(",").map((v) => parseInt(v.trim(), 10));
          if (nums.some(isNaN)) return helpers.error("any.invalid");
          return nums;
        }
      }
      if (trimmed === "") return [];
      const nums = trimmed.split(",").map((v) => parseInt(v.trim(), 10));
      if (nums.some(isNaN)) return helpers.error("any.invalid");
      return nums;
    }
    return helpers.error("any.invalid");
  });

/**
 * Custom Joi type: parse string/JSON-string/comma-separated/bracket-notation sang string[].
 * Dùng cho các trường _name trong multipart/form-data.
 *
 * Các định dạng được hỗ trợ:
 *   "[Alice, Bob]"    → ["Alice", "Bob"]  (bracket notation)
 *   '["Alice","Bob"]' → ["Alice", "Bob"]  (JSON array string)
 *   "Alice,Bob"       → ["Alice", "Bob"]  (comma-separated)
 *   ["Alice", "Bob"]  → ["Alice", "Bob"]  (array thực sự)
 *   ""                → []                (chuỗi rỗng)
 */
export const stringArray = () =>
  Joi.custom((value, helpers) => {
    if (value === undefined || value === null || value === "") return [];
    if (Array.isArray(value)) {
      return value.map((v: any) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        // Thử parse JSON trước: '["Alice","Bob"]'
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed
              .map((v: any) => String(v).trim())
              .filter((v: string) => v.length > 0);
          }
        } catch (_) {
          // Bracket notation không phải JSON: "[Alice, Bob]"
          const inner = trimmed.slice(1, -1);
          return inner
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
        }
      }
      if (trimmed === "") return [];
      return trimmed
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    return helpers.error("any.invalid");
  });

/**
 * Custom Joi type: parse array of { department_id: number, candidate_required: number }
 */
export const departmentArray = () =>
  Joi.custom((value, helpers) => {
    if (value === undefined || value === null || value === "") return [];
    
    let parsed: any = value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return [];
      try {
        parsed = JSON.parse(trimmed);
      } catch (_) {
        return helpers.error("any.invalid");
      }
    }
    
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!item || typeof item !== "object") return helpers.error("any.invalid");
        if (!Number.isInteger(item.department_id) || item.department_id <= 0) return helpers.error("any.invalid");
        if (!Number.isInteger(item.candidate_required) || item.candidate_required <= 0) return helpers.error("any.invalid");
      }
      return parsed;
    }
    return helpers.error("any.invalid");
  });

/**
 * Custom Joi type: parse array of { name: string, candidate_required: number }
 */
export const departmentNameArray = () =>
  Joi.custom((value, helpers) => {
    if (value === undefined || value === null || value === "") return [];
    
    let parsed: any = value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return [];
      try {
        parsed = JSON.parse(trimmed);
      } catch (_) {
        return helpers.error("any.invalid");
      }
    }
    
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!item || typeof item !== "object") return helpers.error("any.invalid");
        if (typeof item.name !== "string" || item.name.trim() === "") return helpers.error("any.invalid");
        item.name = item.name.trim();
        if (!Number.isInteger(item.candidate_required) || item.candidate_required <= 0) return helpers.error("any.invalid");
      }
      return parsed;
    }
    return helpers.error("any.invalid");
  });

/**
 * Custom Joi type: parse array of { note_id: number | null, text: string }
 */
export const notesArray = () =>
  Joi.custom((value, helpers) => {
    if (value === undefined || value === null || value === "") return [];
    
    let parsed: any = value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return [];
      try {
        parsed = JSON.parse(trimmed);
      } catch (_) {
        return helpers.error("any.invalid");
      }
    }
    
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!item || typeof item !== "object") return helpers.error("any.invalid");
        if (item.note_id !== undefined && item.note_id !== null) {
          if (!Number.isInteger(item.note_id) || item.note_id <= 0) return helpers.error("any.invalid");
        }
        if (typeof item.text !== "string" || item.text.trim() === "") return helpers.error("any.invalid");
        item.text = item.text.trim();
      }
      return parsed;
    }
    return helpers.error("any.invalid");
  });

