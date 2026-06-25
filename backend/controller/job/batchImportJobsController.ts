import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import { numberArray, stringArray, departmentArray, departmentNameArray } from "@utilities/joiTypes";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const batchImportJobsController = express.Router();

const jobItemSchema = Joi.object({
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
  jobs: Joi.array().items(jobItemSchema).required().messages({
    "any.required": "Danh sách công việc là bắt buộc",
    "array.base": "Danh sách công việc phải là mảng",
  }),
});

batchImportJobsController.post(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const { jobs } = req.body;

    const result = await withTransaction(async (pool) => {
       return await Job.batchImport(jobs, pool);
    }, req.user);

    res.status(200).json({
      result: true,
      message: "Thực hiện import loạt thành công",
      data: result,
    });
  }
);

export default batchImportJobsController;
