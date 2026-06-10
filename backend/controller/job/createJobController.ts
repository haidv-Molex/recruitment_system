/**
 * API Create Job Controller
 * Method: POST /job
 * Content-Type: multipart/form-data
 *
 * Request Fields:
 * - job_code (string, required): Mã công việc
 * - project (string, required): Dự án tuyển dụng
 * - candidate_required (number, required): Số lượng ứng viên yêu cầu
 * - note (string, optional): Ghi chú bổ sung
 * - file (file, optional): File mô tả công việc (JD), max 5MB
 * - partners (number[] / string, optional): Mảng danh sách user_id của đối tác
 * - departments (number[] / string, optional): Mảng danh sách department_id
 * - segments (number[] / string, optional): Mảng danh sách segment_id
 * - sites (number[] / string, optional): Mảng danh sách site_id
 * - titles (number[] / string, optional): Mảng danh sách level_id của chức danh
 * - managers (number[] / string, optional): Mảng danh sách user_id của hiring managers
 * - employee_levels (number[] / string, optional): Mảng danh sách level_id của cấp bậc
 */
import express from "express";
import Joi from "joi";
import multer from "multer";
import joiValidate from "@middlewares/joiValidate";
import { numberArray } from "@utilities/joiTypes";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createJobController = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});



const bodySchema = Joi.object({
  job_code: Joi.string().min(1).max(255).required().messages({
    "any.required": "Mã công việc là bắt buộc",
    "string.empty": "Mã công việc không được để trống",
    "string.min": "Mã công việc phải có ít nhất 1 ký tự",
    "string.max": "Mã công việc không được vượt quá 255 ký tự",
  }),
  project: Joi.string().min(1).max(255).required().messages({
    "any.required": "Dự án là bắt buộc",
    "string.empty": "Dự án không được để trống",
    "string.min": "Dự án phải có ít nhất 1 ký tự",
    "string.max": "Dự án không được vượt quá 255 ký tự",
  }),
  candidate_required: Joi.number().integer().min(1).required().messages({
    "any.required": "Số lượng ứng viên là bắt buộc",
    "number.base": "Số lượng ứng viên phải là số",
    "number.integer": "Số lượng ứng viên phải là số nguyên",
    "number.min": "Số lượng ứng viên phải lớn hơn 0",
  }),
  note: Joi.string().max(5000).allow("", null).optional(),
  partners: numberArray().optional(),
  departments: numberArray().optional(),
  segments: numberArray().optional(),
  sites: numberArray().optional(),
  titles: numberArray().optional(),
  managers: numberArray().optional(),
  employee_levels: numberArray().optional(),
});

createJobController.post(
  "",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const body = req.body;

    const file = req.file
      ? { originalname: req.file.originalname, buffer: req.file.buffer }
      : null;

    const result = await withTransaction(async (pool) => {
      return await Job.create(
        {
          job_code: body.job_code,
          project: body.project,
          candidate_required: body.candidate_required,
          note: body.note || null,
          file,
          partners: body.partners ?? [],
          departments: body.departments ?? [],
          segments: body.segments ?? [],
          sites: body.sites ?? [],
          titles: body.titles ?? [],
          managers: body.managers ?? [],
          employee_levels: body.employee_levels ?? [],
        },
        pool
      );
    });

    res.status(201).json({
      result: true,
      message: "Tạo công việc thành công",
      data: result,
    });
  }
);

export default createJobController;
