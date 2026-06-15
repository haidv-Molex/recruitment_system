/**
 * API Create Candidate With Auto-create Lookup Records
 * Method: POST /candidate/extended
 * Content-Type: multipart/form-data
 *
 * Tất cả các trường của POST /candidate, cộng thêm:
 * - recruiter_name        (string, optional): Tên recruiter – user sẽ được tạo mới nếu không truyền recruiter (ID)
 * - reference_name        (string, optional): Tên người giới thiệu – user sẽ được tạo mới nếu không truyền reference (ID)
 * - platform_name         (string, optional): Tên platform – platform sẽ được tạo mới nếu không truyền platform_id
 * - targeted_company_name (string, optional): Tên công ty đích – company sẽ được tạo mới nếu không truyền targeted_company (ID)
 *
 * Ưu tiên: nếu cả ID lẫn _name đều được truyền, ID sẽ được sử dụng.
 */
import express from "express";
import multer from "multer";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import { numberArray, stringArray } from "@utilities/joiTypes";
import Candidate from "@services/candidate/_Candidate";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createCandidateWithAllController = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const bodySchema = Joi.object({
  // --- Trường bắt buộc ---
  candidate_name: Joi.string().max(255).required().messages({
    "any.required": "Tên ứng viên là bắt buộc",
    "string.base": "Tên ứng viên phải là chuỗi",
    "string.empty": "Tên ứng viên là bắt buộc",
    "string.max": "Tên ứng viên không được vượt quá 255 ký tự",
  }),
  status: Joi.string().max(100).required().messages({
    "any.required": "Trạng thái ứng viên là bắt buộc",
    "string.base": "Trạng thái ứng viên phải là chuỗi",
    "string.empty": "Trạng thái ứng viên là bắt buộc",
    "string.max": "Trạng thái không được vượt quá 100 ký tự",
  }),

  // --- Trường scalar tùy chọn (giống createCandidateController) ---
  candidate_code: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Mã ứng viên không được vượt quá 255 ký tự",
  }),
  candidate_email: Joi.string().email().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.email": "Email không hợp lệ",
    "string.max": "Email không được vượt quá 255 ký tự",
  }),
  candidate_phone: Joi.string().max(50).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Số điện thoại không được vượt quá 50 ký tự",
  }),
  agency: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Agency không được vượt quá 255 ký tự",
  }),
  offer_date: Joi.date().iso().empty(["", "null"]).allow(null).default(null).messages({
    "date.format": "Trường offer_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường offer_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
  }),
  onboard_date: Joi.date().iso().empty(["", "null"]).allow(null).default(null).messages({
    "date.format": "Trường onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
  }),
  expected_onboard_date: Joi.date().iso().empty(["", "null"]).allow(null).default(null).messages({
    "date.format": "Trường expected_onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường expected_onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
  }),
  feedback_date: Joi.date().iso().empty(["", "null"]).allow(null).default(null).messages({
    "date.format": "Trường feedback_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường feedback_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
  }),
  current_salary: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Lương hiện tại không được vượt quá 255 ký tự",
  }),
  expected_salary: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Lương mong muốn không được vượt quá 255 ký tự",
  }),
  note: Joi.string().empty(["", "null"]).allow(null).default(null),
  job_id: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Job ID phải là số nguyên",
    "number.integer": "Job ID phải là số nguyên",
  }),
  job_code: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Mã job không được vượt quá 255 ký tự",
  }),
  project: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Project không được vượt quá 255 ký tự",
  }),

  // --- FK bằng ID gốc ---
  recruiter: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Recruiter ID phải là số nguyên",
    "number.integer": "Recruiter ID phải là số nguyên",
  }),
  platform_id: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Platform ID phải là số nguyên",
    "number.integer": "Platform ID phải là số nguyên",
  }),
  targeted_company: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Targeted Company ID phải là số nguyên",
    "number.integer": "Targeted Company ID phải là số nguyên",
  }),
  reference: Joi.number().integer().empty(["", "null"]).allow(null).default(null).messages({
    "number.base": "Reference ID phải là số nguyên",
    "number.integer": "Reference ID phải là số nguyên",
  }),
  candidate_levels: numberArray().optional(),

  // --- FK bằng tên – tự động tạo bản ghi mới ---
  recruiter_name: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Tên recruiter không được vượt quá 255 ký tự",
  }),
  reference_name: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Tên người giới thiệu không được vượt quá 255 ký tự",
  }),
  platform_name: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Tên platform không được vượt quá 255 ký tự",
  }),
  targeted_company_name: Joi.string().max(255).empty(["", "null"]).allow(null).default(null).messages({
    "string.max": "Tên công ty đích không được vượt quá 255 ký tự",
  }),
  candidate_levels_name: stringArray().optional(),
});

createCandidateWithAllController.post(
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
      return await Candidate.createWithAll(
        {
          candidate_name: body.candidate_name.trim(),
          status: body.status.trim(),
          candidate_code: body.candidate_code,
          candidate_email: body.candidate_email,
          candidate_phone: body.candidate_phone,
          agency: body.agency,
          offer_date: body.offer_date,
          onboard_date: body.onboard_date,
          expected_onboard_date: body.expected_onboard_date,
          feedback_date: body.feedback_date,
          current_salary: body.current_salary,
          expected_salary: body.expected_salary,
          note: body.note,
          job_id: body.job_id,
          job_code: body.job_code,
          project: body.project,
          file,

          // FK bằng ID gốc
          recruiter: body.recruiter,
          platform_id: body.platform_id,
          targeted_company: body.targeted_company,
          reference: body.reference,
          candidate_levels: body.candidate_levels ?? [],

          // FK bằng tên – tự động tạo
          recruiter_name: body.recruiter_name,
          platform_name: body.platform_name,
          targeted_company_name: body.targeted_company_name,
          reference_name: body.reference_name,
          candidate_levels_name: body.candidate_levels_name ?? [],
        },
        pool
      );
    });

    res.status(201).json({
      result: true,
      message: "Tạo ứng viên thành công",
      data: result,
    });
  }
);

export default createCandidateWithAllController;
