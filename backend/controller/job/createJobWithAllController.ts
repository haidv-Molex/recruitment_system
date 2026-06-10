/**
 * API Create Job with Auto-create Lookup Records
 * Method: POST /job/extended
 * Content-Type: multipart/form-data
 *
 * Request Fields (tất cả các trường của /job gốc, cộng thêm):
 * - partners_name   (string / JSON array, optional): Tên các đối tác mới – user sẽ được tạo mới
 * - managers_name   (string / JSON array, optional): Tên các hiring manager mới – user sẽ được tạo mới
 * - departments_name(string / JSON array, optional): Tên phòng ban mới (code = name.toUpperCase())
 * - segments_name   (string / JSON array, optional): Tên phân khúc mới
 * - sites_name      (string / JSON array, optional): Tên địa điểm mới
 * - titles_name     (string / JSON array, optional): Tên chức danh mới (gộp với employee_levels_name)
 * - employee_levels_name (string / JSON array, optional): Tên cấp bậc nhân viên mới (gộp với titles_name)
 */
import express from "express";
import Joi from "joi";
import multer from "multer";
import joiValidate from "@middlewares/joiValidate";
import { numberArray, stringArray } from "@utilities/joiTypes";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createJobWithAllController = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});



const bodySchema = Joi.object({
  // --- Trường Job bắt buộc ---
  job_code: Joi.string().min(1).max(255).required().messages({
    "any.required": "Mã công việc là bắt buộc",
    "string.empty": "Mã công việc không được để trống",
    "string.max": "Mã công việc không được vượt quá 255 ký tự",
  }),
  project: Joi.string().min(1).max(255).required().messages({
    "any.required": "Dự án là bắt buộc",
    "string.empty": "Dự án không được để trống",
    "string.max": "Dự án không được vượt quá 255 ký tự",
  }),
  candidate_required: Joi.number().integer().min(1).required().messages({
    "any.required": "Số lượng ứng viên là bắt buộc",
    "number.base": "Số lượng ứng viên phải là số",
    "number.integer": "Số lượng ứng viên phải là số nguyên",
    "number.min": "Số lượng ứng viên phải lớn hơn 0",
  }),
  note: Joi.string().max(5000).allow("", null).optional(),

  // --- ID gốc (các record đã tồn tại) ---
  partners: numberArray().optional(),
  departments: numberArray().optional(),
  segments: numberArray().optional(),
  sites: numberArray().optional(),
  titles: numberArray().optional(),
  managers: numberArray().optional(),
  employee_levels: numberArray().optional(),

  // --- _name: tự động tạo record mới ---
  partners_name: stringArray().optional(),
  managers_name: stringArray().optional(),
  departments_name: stringArray().optional(),
  segments_name: stringArray().optional(),
  sites_name: stringArray().optional(),
  titles_name: stringArray().optional(),
  employee_levels_name: stringArray().optional(),
});

createJobWithAllController.post(
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
      return await Job.createWithAll(
        {
          job_code: body.job_code,
          project: body.project,
          candidate_required: body.candidate_required,
          note: body.note || null,
          file,

          // ID gốc
          partners: body.partners ?? [],
          departments: body.departments ?? [],
          segments: body.segments ?? [],
          sites: body.sites ?? [],
          titles: body.titles ?? [],
          managers: body.managers ?? [],
          employee_levels: body.employee_levels ?? [],

          // _name: tự động tạo mới
          partners_name: body.partners_name ?? [],
          managers_name: body.managers_name ?? [],
          departments_name: body.departments_name ?? [],
          segments_name: body.segments_name ?? [],
          sites_name: body.sites_name ?? [],
          titles_name: body.titles_name ?? [],
          employee_levels_name: body.employee_levels_name ?? [],
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

export default createJobWithAllController;
