/**
 * API Create Candidate Controller
 * Method: POST /candidate
 * Content-Type: multipart/form-data
 *
 * Request Fields:
 * - candidate_code (string, optional): Mã ứng viên
 * - candidate_name (string, required): Tên ứng viên
 * - candidate_email (string, optional): Email ứng viên
 * - candidate_phone (string, optional): Số điện thoại ứng viên
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
import { candidateDetailBodyFields } from "@controller/candidate_detail/validation";
import { candidateDetailWriteFields } from "@services/candidate_detail/types";
import parseCandidateDetailMultipartFields from "./parseCandidateDetailMultipartFields";

const createCandidateController = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const phoneNumberPattern = /^\+?\d+(?:\.\d+)*$/;

const bodySchema = Joi.object({
  ...candidateDetailBodyFields(true),
  candidate_code: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Mã ứng viên không được vượt quá 255 ký tự"
  }),
  candidate_name: Joi.string().max(255).required().messages({
    "any.required": "Tên ứng viên là bắt buộc",
    "string.base": "Tên ứng viên phải là chuỗi",
    "string.empty": "Tên ứng viên là bắt buộc",
    "string.max": "Tên ứng viên không được vượt quá 255 ký tự"
  }),
  candidate_email: Joi.string().email().max(255).empty(["", "null"]).allow(null).default(null).messages({
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
  targeted_company_name: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Tên công ty đích không được vượt quá 255 ký tự"
  }),
  reference: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Reference ID phải là số nguyên",
    "number.integer": "Reference ID phải là số nguyên"
  }),
  candidate_levels: numberArray().optional()
});

createCandidateController.post("",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  parseCandidateDetailMultipartFields,
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const candidateData: any = {
      candidate_code: req.body.candidate_code,
      candidate_name: req.body.candidate_name.trim(),
      candidate_email: req.body.candidate_email,
      candidate_phone: req.body.candidate_phone,
      agency: req.body.agency,
      status: req.body.status.trim(),
      note: req.body.note,
      platform_id: req.body.platform_id,
      job_id: req.body.job_id,
      targeted_company: req.body.targeted_company,
      targeted_company_name: req.body.targeted_company_name,
      reference: req.body.reference,
      candidate_levels: req.body.candidate_levels ?? [],
      file: req.file ? {
        originalname: req.file.originalname,
        buffer: req.file.buffer
      } : null
    };

    candidateDetailWriteFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        candidateData[field] = req.body[field];
      }
    });

    const result = await withTransaction(async (pool) => {
      return await Candidate.create(candidateData, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo ứng viên thành công",
      data: result
    });
  }
);

export default createCandidateController;
