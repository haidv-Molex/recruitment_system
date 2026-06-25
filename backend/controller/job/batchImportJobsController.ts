import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import { numberArray, stringArray, departmentArray, departmentNameArray } from "@utilities/joiTypes";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const batchImportJobsController = express.Router();

const jobItemSchema = Joi.object({
  row_index: Joi.number().integer().optional(),
  job_code: Joi.string().min(1).max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Mã công việc không được vượt quá 255 ký tự",
  }),
  project: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Dự án không được vượt quá 255 ký tự",
  }),
  note: Joi.string().max(5000).allow("", null).optional(),
  request_date: Joi.date().iso().empty(["", "null"]).allow(null).default(null),
  recruiter_id: Joi.number().integer().allow(null).optional(),

  // ID gốc
  partners: numberArray().optional(),
  departments: departmentArray().optional(),
  segments: numberArray().optional(),
  sites: numberArray().optional(),
  titles: numberArray().optional(),
  managers: numberArray().optional(),
  employee_levels: numberArray().optional(),

  // _name tự động tạo mới
  partners_name: stringArray().optional(),
  departments_name: departmentNameArray().optional(),
  segments_name: stringArray().optional(),
  sites_name: stringArray().optional(),
  titles_name: stringArray().optional(),
  managers_name: stringArray().optional(),
  employee_levels_name: stringArray().optional(),
  recruiter_name: Joi.string().max(255).allow("", null).optional(),
});

const bodySchema = Joi.object({
  jobs: Joi.array().required().messages({
    "any.required": "Danh sách công việc là bắt buộc",
    "array.base": "Danh sách công việc phải là mảng",
  }),
});

batchImportJobsController.post(
  "",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Validate request body structure first
    const { error: bodyError, value: bodyValue } = bodySchema.validate(req.body, { abortEarly: false });
    if (bodyError) {
      return res.status(400).json({
        result: false,
        message: "Cấu trúc danh sách không hợp lệ",
        details: bodyError.details.map((d) => d.message),
      });
    }

    const { jobs } = bodyValue;

    const validJobs: any[] = [];
    const errors: any[] = [];

    jobs.forEach((j: any, index: number) => {
      const { error, value } = jobItemSchema.validate(j, {
        abortEarly: false,
        convert: true,
        errors: {
          label: "key",
          wrap: { label: false },
        },
      });

      if (error) {
        errors.push({
          row_index: typeof j.row_index === "number" ? j.row_index : null,
          job_code: j.job_code || `Dòng ${index + 1}`,
          message: error.details.map((d) => d.message).join(", "),
        });
      } else {
        validJobs.push(value);
      }
    });

    let result = {
      success: true,
      importedCount: 0,
      errors: [] as any[],
    };

    if (validJobs.length > 0) {
      const importRes = await withTransaction(async (pool) => {
         return await Job.batchImport(validJobs, pool);
      }, req.user);
      result = {
        success: importRes.success,
        importedCount: importRes.importedCount,
        errors: importRes.errors,
      };
    }

    res.status(200).json({
      result: true,
      message: "Thực hiện import loạt thành công",
      data: {
        success: result.success && errors.length === 0,
        importedCount: result.importedCount,
        errors: [...errors, ...result.errors],
      },
    });
  }
);

export default batchImportJobsController;
