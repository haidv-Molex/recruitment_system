import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import multer from "multer";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateJobController = express.Router({ mergeParams: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã công việc phải là số",
    "number.integer": "Mã công việc phải là số nguyên",
    "number.positive": "Mã công việc phải là số dương",
    "any.required": "Mã công việc là bắt buộc"
  })
});

function parseArrayField(field: any): number[] {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.map(v => parseInt(v, 10)).filter(v => !isNaN(v));
  }
  if (typeof field === "string") {
    if (field.startsWith("[") && field.endsWith("]")) {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) {
          return parsed.map(v => parseInt(v, 10)).filter(v => !isNaN(v));
        }
      } catch (e) {
        // Fall back
      }
    }
    return field.split(",").map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
  }
  return [];
}

updateJobController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  upload.single("file"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);
    const body = req.body || {};

    const updateData: any = {};
    if (body.job_code !== undefined) updateData.job_code = body.job_code;
    if (body.project !== undefined) updateData.project = body.project;
    if (body.candidate_required !== undefined) {
      updateData.candidate_required = parseInt(body.candidate_required, 10);
      if (isNaN(updateData.candidate_required) || updateData.candidate_required <= 0) {
        return res.status(400).json({
          result: false,
          message: "Dữ liệu không hợp lệ",
          details: ["Số lượng ứng viên yêu cầu phải là số nguyên dương"]
        });
      }
    }
    if (body.note !== undefined) updateData.note = body.note;

    // Parse relationship fields only if they were passed (using prototype check for safety)
    const hasProp = (o: any, p: string) => Object.prototype.hasOwnProperty.call(o, p);

    if (hasProp(body, "partners")) updateData.partners = parseArrayField(body.partners);
    if (hasProp(body, "departments")) updateData.departments = parseArrayField(body.departments);
    if (hasProp(body, "segments")) updateData.segments = parseArrayField(body.segments);
    if (hasProp(body, "sites")) updateData.sites = parseArrayField(body.sites);
    if (hasProp(body, "titles")) updateData.titles = parseArrayField(body.titles);
    if (hasProp(body, "managers")) updateData.managers = parseArrayField(body.managers);
    if (hasProp(body, "employee_levels")) updateData.employee_levels = parseArrayField(body.employee_levels);

    if (req.file) {
      updateData.file = {
        originalname: req.file.originalname,
        buffer: req.file.buffer
      };
    }

    const result = await withTransaction(async (pool) => {
      return await Job.update(id, updateData, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin công việc thành công",
      data: result
    });
  }
);

export default updateJobController;
