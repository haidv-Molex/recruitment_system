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
import multer from "multer";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createJobWithAllController = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

function parseArrayField(field: any): number[] {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
  }
  if (typeof field === "string") {
    if (field.startsWith("[") && field.endsWith("]")) {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
        }
      } catch (_) {
        // fall back
      }
    }
    return field
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !isNaN(v));
  }
  return [];
}

function parseStringArrayField(field: any): string[] {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.map((v) => String(v).trim()).filter((v) => v.length > 0);
  }
  if (typeof field === "string") {
    if (field.startsWith("[") && field.endsWith("]")) {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v).trim()).filter((v) => v.length > 0);
        }
      } catch (_) {
        // fall back
      }
    }
    return field
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return [];
}

createJobWithAllController.post(
  "",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  async (req, res) => {
    const body = req.body || {};
    const candidate_required = parseInt(body.candidate_required, 10);

    if (!body.job_code || body.job_code.trim() === "") {
      return res.status(400).json({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Mã công việc là bắt buộc"],
      });
    }

    if (!body.project || body.project.trim() === "") {
      return res.status(400).json({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Dự án là bắt buộc"],
      });
    }

    if (isNaN(candidate_required) || candidate_required <= 0) {
      return res.status(400).json({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Số lượng ứng viên yêu cầu phải là số nguyên dương"],
      });
    }

    const file = req.file
      ? { originalname: req.file.originalname, buffer: req.file.buffer }
      : null;

    const result = await withTransaction(async (pool) => {
      return await Job.createWithAll(
        {
          job_code: body.job_code,
          project: body.project,
          candidate_required,
          note: body.note || null,
          file,

          // ID gốc
          partners: parseArrayField(body.partners),
          departments: parseArrayField(body.departments),
          segments: parseArrayField(body.segments),
          sites: parseArrayField(body.sites),
          titles: parseArrayField(body.titles),
          managers: parseArrayField(body.managers),
          employee_levels: parseArrayField(body.employee_levels),

          // _name: tự động tạo mới
          partners_name: parseStringArrayField(body.partners_name),
          managers_name: parseStringArrayField(body.managers_name),
          departments_name: parseStringArrayField(body.departments_name),
          segments_name: parseStringArrayField(body.segments_name),
          sites_name: parseStringArrayField(body.sites_name),
          titles_name: parseStringArrayField(body.titles_name),
          employee_levels_name: parseStringArrayField(body.employee_levels_name),
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
