/**
 * API Update Job Controller
 * Method: PUT /job?id=:id
 * Content-Type: multipart/form-data
 *
 * Request Fields (tất cả optional – chỉ cập nhật những gì được truyền):
 * - job_code (string, optional): Mã công việc
 * - project (string, optional): Dự án tuyển dụng
 * - candidate_required (number, optional): Số lượng ứng viên yêu cầu
 * - note (string, optional): Ghi chú bổ sung
 * - file (file, optional): File mô tả công việc (JD), max 5MB
 * - partners (number[] / string, optional): Mảng user_id đối tác
 * - departments (number[] / string, optional): Mảng department_id
 * - segments (number[] / string, optional): Mảng segment_id
 * - sites (number[] / string, optional): Mảng site_id
 * - titles (number[] / string, optional): Mảng level_id chức danh
 * - managers (number[] / string, optional): Mảng user_id hiring managers
 * - employee_levels (number[] / string, optional): Mảng level_id cấp bậc
 */
import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import multer from "multer";
import { numberArray, stringArray } from "@utilities/joiTypes";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateJobController = express.Router({ mergeParams: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã công việc phải là số",
    "number.integer": "Mã công việc phải là số nguyên",
    "number.positive": "Mã công việc phải là số dương",
    "any.required": "Mã công việc là bắt buộc",
  }),
});



/**
 * Schema cho body update – tất cả trường đều optional.
 * Joi với convert:true sẽ tự chuyển candidate_required từ string sang number.
 * unknown() cho phép các key không khai báo bị bỏ qua (không lỗi).
 */
const bodySchema = Joi.object({
  job_code: Joi.string().min(1).max(255).optional().messages({
    "string.empty": "Mã công việc không được để trống",
    "string.max": "Mã công việc không được vượt quá 255 ký tự",
  }),
  project: Joi.string().min(1).max(255).optional().messages({
    "string.empty": "Dự án không được để trống",
    "string.max": "Dự án không được vượt quá 255 ký tự",
  }),
  candidate_required: Joi.number().integer().min(1).optional().messages({
    "number.base": "Số lượng ứng viên phải là số",
    "number.integer": "Số lượng ứng viên phải là số nguyên",
    "number.min": "Số lượng ứng viên phải lớn hơn 0",
  }),
  note: Joi.string().max(5000).allow("", null).optional(),
  request_date: Joi.date().iso().empty(["", "null"]).allow(null).optional().messages({
    "date.format": "Trường request_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường request_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"
  }),
  partners: numberArray().optional(),
  departments: numberArray().optional(),
  segments: numberArray().optional(),
  sites: numberArray().optional(),
  titles: numberArray().optional(),
  managers: numberArray().optional(),
  employee_levels: numberArray().optional(),

  partners_name: stringArray().optional(),
  departments_name: stringArray().optional(),
  segments_name: stringArray().optional(),
  sites_name: stringArray().optional(),
  titles_name: stringArray().optional(),
  managers_name: stringArray().optional(),
  employee_levels_name: stringArray().optional(),
});

updateJobController.put(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  upload.single("file"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const id = Number(req.query.id);
    const body = req.body;

    // Chỉ truyền vào updateData những key thực sự có trong request body
    const updateData: any = {};
    const keys = [
      "job_code",
      "project",
      "candidate_required",
      "note",
      "request_date",
      "partners",
      "departments",
      "segments",
      "sites",
      "titles",
      "managers",
      "employee_levels",
      "partners_name",
      "departments_name",
      "segments_name",
      "sites_name",
      "titles_name",
      "managers_name",
      "employee_levels_name",
    ];
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updateData[key] = body[key];
      }
    }

    if (req.file) {
      updateData.file = {
        originalname: req.file.originalname,
        buffer: req.file.buffer,
      };
    }

    const result = await withTransaction(async (pool) => {
      return await Job.update(id, updateData, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin công việc thành công",
      data: result,
    });
  }
);

export default updateJobController;
