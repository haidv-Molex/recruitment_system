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
 * - file (file, optional): File mô tả công việc (JD), định dạng hỗ trợ: pdf, docx, doc, txt, jpg, png, webp (max 5MB)
 * - partners (number[] / string, optional): Mảng danh sách user_id của đối tác (ví dụ: [1,2] hoặc "1,2")
 * - departments (number[] / string, optional): Mảng danh sách department_id của các phòng ban
 * - segments (number[] / string, optional): Mảng danh sách segment_id của phân khúc
 * - sites (number[] / string, optional): Mảng danh sách site_id của các địa điểm
 * - titles (number[] / string, optional): Mảng danh sách level_id của chức danh
 * - managers (number[] / string, optional): Mảng danh sách user_id của hiring managers
 * - employee_levels (number[] / string, optional): Mảng danh sách level_id của cấp bậc nhân viên
 */
import express from "express";
import multer from "multer";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createJobController = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
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

createJobController.post("",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  async (req, res) => {
    const body = req.body || {};
    const candidate_required = parseInt(body.candidate_required, 10);

    if (!body.job_code || body.job_code.trim() === "") {
      return res.status(400).json({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Mã công việc là bắt buộc"]
      });
    }

    if (!body.project || body.project.trim() === "") {
      return res.status(400).json({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Dự án là bắt buộc"]
      });
    }

    if (isNaN(candidate_required) || candidate_required <= 0) {
      return res.status(400).json({
        result: false,
        message: "Dữ liệu không hợp lệ",
        details: ["Số lượng ứng viên yêu cầu phải là số nguyên dương"]
      });
    }

    const partners = parseArrayField(body.partners);
    const departments = parseArrayField(body.departments);
    const segments = parseArrayField(body.segments);
    const sites = parseArrayField(body.sites);
    const titles = parseArrayField(body.titles);
    const managers = parseArrayField(body.managers);
    const employee_levels = parseArrayField(body.employee_levels);

    const file = req.file ? {
      originalname: req.file.originalname,
      buffer: req.file.buffer
    } : null;

    const result = await withTransaction(async (pool) => {
      return await Job.create({
        job_code: body.job_code,
        project: body.project,
        candidate_required,
        note: body.note || null,
        file,
        partners,
        departments,
        segments,
        sites,
        titles,
        managers,
        employee_levels
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo công việc thành công",
      data: result
    });
  }
);

export default createJobController;
