/**
 * API Create Candidate Controller
 * Method: POST /candidate
 * Content-Type: multipart/form-data
 *
 * Request Fields:
 * - candidate_code (string, optional): Mã ứng viên
 * - candidate_name (string, required): Tên ứng viên
 * - candidate_email (string, optional): Email ứng viên (ít nhất một trong email hoặc phone phải có)
 * - candidate_phone (string, optional): Số điện thoại ứng viên (ít nhất một trong email hoặc phone phải có)
 * - agency (string, optional): Agency tuyển dụng
 * - offer_date (string/date, optional): Ngày gửi offer (định dạng YYYY-MM-DD hoặc ISO)
 * - onboard_date (string/date, optional): Ngày nhận việc thực tế
 * - expected_onboard_date (string/date, optional): Ngày dự kiến nhận việc
 * - feedback_date (string/date, optional): Ngày phản hồi thông tin
 * - current_salary (string, optional): Mức lương hiện tại
 * - expected_salary (string, optional): Mức lương mong muốn
 * - status (string, required): Trạng thái tuyển dụng của ứng viên
 * - note (string, optional): Ghi chú bổ sung
 * - platform_id (number, optional): ID kênh nguồn tuyển dụng (Platform ID)
 * - job_id (number, optional): ID vị trí công việc ứng tuyển (Job ID)
 * - targeted_company (number, optional): ID công ty đích (Company ID)
 * - reference (number, optional): ID người giới thiệu nội bộ (User ID)
 * - file (file, optional): Tệp CV đính kèm, định dạng hỗ trợ: pdf, docx, doc, txt, jpg, png, webp (max 5MB)
 */
import express from "express";
import multer from "multer";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import { numberArray } from "@utilities/joiTypes";
import Candidate from "@services/candidate/_Candidate";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createCandidateController = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const phoneNumberPattern = /^\+?\d+(?:\.\d+)*$/;

const bodySchema = Joi.object({
  candidate_code: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Mã ứng viên không được vượt quá 255 ký tự"
  }),
  candidate_name: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.base": "Tên ứng viên phải là chuỗi",
    "string.max": "Tên ứng viên không được vượt quá 255 ký tự"
  }),
  candidate_email: Joi.string().email().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.base": "Email ứng viên phải là chuỗi",
    "string.email": "Email không hợp lệ",
    "string.max": "Email không được vượt quá 255 ký tự"
  }),
  candidate_phone: Joi.string().trim().max(50).pattern(phoneNumberPattern).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Số điện thoại không được vượt quá 50 ký tự",
    "string.pattern.base": "Số điện thoại chỉ được chứa chữ số, dấu chấm phân tách nhóm số và có thể bắt đầu bằng dấu +"
  }),
  agency: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Agency không được vượt quá 255 ký tự"
  }),
  offer_date: Joi.date().iso().empty(["", "null"]).allow(null).default(null).messages({
    "date.format": "Trường offer_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường offer_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"
  }),
  onboard_date: Joi.date().iso().empty(["", "null"]).allow(null).default(null).messages({
    "date.format": "Trường onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"
  }),
  expected_onboard_date: Joi.date().iso().empty(["", "null"]).allow(null).default(null).messages({
    "date.format": "Trường expected_onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường expected_onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"
  }),
  feedback_date: Joi.date().iso().empty(["", "null"]).allow(null).default(null).messages({
    "date.format": "Trường feedback_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường feedback_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"
  }),
  current_salary: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Lương hiện tại không được vượt quá 255 ký tự"
  }),
  expected_salary: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Lương mong muốn không được vượt quá 255 ký tự"
  }),
  status: Joi.string().max(100).required().messages({
    "any.required": "Trạng thái ứng viên là bắt buộc",
    "string.base": "Trạng thái ứng viên phải là chuỗi",
    "string.empty": "Trạng thái ứng viên là bắt buộc",
    "string.max": "Trạng thái không được vượt quá 100 ký tự"
  }),
  note: Joi.string().empty(["", "null"]).allow(null).default(null),
  platform_id: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Platform ID phải là số nguyên",
    "number.integer": "Platform ID phải là số nguyên"
  }),
  job_id: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Job ID phải là số nguyên",
    "number.integer": "Job ID phải là số nguyên"
  }),
  targeted_company: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Targeted Company ID phải là số nguyên",
    "number.integer": "Targeted Company ID phải là số nguyên"
  }),
  reference: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Reference ID phải là số nguyên",
    "number.integer": "Reference ID phải là số nguyên"
  }),
  candidate_levels: numberArray().optional()
}).custom((value, helpers) => {
  if (!value.candidate_email && !value.candidate_phone) {
    return helpers.error('any.custom', { message: 'Phải cung cấp ít nhất Email hoặc Số điện thoại ứng viên' });
  }
  return value;
}).messages({
  "any.custom": "{{#message}}"
});

createCandidateController.post("",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const candidateData = {
      candidate_code: req.body.candidate_code,
      candidate_name: req.body.candidate_name ? req.body.candidate_name.trim() : null,
      candidate_email: req.body.candidate_email ? req.body.candidate_email.trim() : null,
      candidate_phone: req.body.candidate_phone,
      agency: req.body.agency,
      offer_date: req.body.offer_date,
      onboard_date: req.body.onboard_date,
      expected_onboard_date: req.body.expected_onboard_date,
      feedback_date: req.body.feedback_date,
      current_salary: req.body.current_salary,
      expected_salary: req.body.expected_salary,
      status: req.body.status.trim(),
      note: req.body.note,
      platform_id: req.body.platform_id,
      job_id: req.body.job_id,
      targeted_company: req.body.targeted_company,
      reference: req.body.reference,
      candidate_levels: req.body.candidate_levels ?? [],
      file: req.file ? {
        originalname: req.file.originalname,
        buffer: req.file.buffer
      } : null,
      creator_id: (req.user as any).user_id
    };

    const result = await withTransaction(async (pool) => {
      return await Candidate.create(candidateData, pool);
    }, req.user);

    res.status(201).json({
      result: true,
      message: "Tạo ứng viên thành công",
      data: result
    });
  }
);

export default createCandidateController;
