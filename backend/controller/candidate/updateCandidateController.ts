import express from "express";
import multer from "multer";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import { numberArray } from "@utilities/joiTypes";
import Candidate from "@services/candidate/_Candidate";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateCandidateController = express.Router({ mergeParams: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const phoneNumberPattern = /^\+?\d+(?:\.\d+)*$/;

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã ứng viên phải là số",
    "number.integer": "Mã ứng viên phải là số nguyên",
    "number.positive": "Mã ứng viên phải là số dương",
    "any.required": "Mã ứng viên là bắt buộc"
  })
});

const updateBodySchema = Joi.object({
  candidate_code: Joi.string().max(255).empty(["", "null"]).allow(null).optional(),
  candidate_name: Joi.string().max(255).min(1).optional().messages({
    "string.empty": "Tên ứng viên không được để trống",
    "string.base": "Tên ứng viên phải là chuỗi"
  }),
  candidate_email: Joi.string().email().max(255).empty(["", "null"]).allow(null).optional().messages({
    "string.email": "Email không hợp lệ"
  }),
  candidate_phone: Joi.string().trim().max(50).pattern(phoneNumberPattern).empty(["", "null"]).allow(null).optional().messages({
    "string.max": "Số điện thoại không được vượt quá 50 ký tự",
    "string.pattern.base": "Số điện thoại chỉ được chứa chữ số, dấu chấm phân tách nhóm số và có thể bắt đầu bằng dấu +"
  }),
  agency: Joi.string().max(255).empty(["", "null"]).allow(null).optional(),
  offer_date: Joi.date().iso().empty(["", "null"]).allow(null).optional().messages({
    "date.format": "Trường offer_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường offer_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"
  }),
  onboard_date: Joi.date().iso().empty(["", "null"]).allow(null).optional().messages({
    "date.format": "Trường onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"
  }),
  expected_onboard_date: Joi.date().iso().empty(["", "null"]).allow(null).optional().messages({
    "date.format": "Trường expected_onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường expected_onboard_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"
  }),
  feedback_date: Joi.date().iso().empty(["", "null"]).allow(null).optional().messages({
    "date.format": "Trường feedback_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)",
    "date.base": "Trường feedback_date không đúng định dạng ngày (YYYY-MM-DD hoặc ISO)"
  }),
  current_salary: Joi.string().max(255).empty(["", "null"]).allow(null).optional(),
  expected_salary: Joi.string().max(255).empty(["", "null"]).allow(null).optional(),
  status: Joi.string().max(100).min(1).optional().messages({
    "string.empty": "Trạng thái ứng viên không được để trống",
    "string.base": "Trạng thái ứng viên phải là chuỗi"
  }),
  note: Joi.string().empty(["", "null"]).allow(null).optional(),
  platform_id: Joi.number().integer().empty(["", "null"]).allow(null).optional().messages({
    "number.base": "Platform ID phải là số nguyên",
    "number.integer": "Platform ID phải là số nguyên"
  }),
  recruiter: Joi.number().integer().empty(["", "null"]).allow(null).optional().messages({
    "number.base": "Recruiter ID phải là số nguyên",
    "number.integer": "Recruiter ID phải là số nguyên"
  }),
  job_id: Joi.number().integer().empty(["", "null"]).allow(null).optional().messages({
    "number.base": "Job ID phải là số nguyên",
    "number.integer": "Job ID phải là số nguyên"
  }),
  targeted_company: Joi.number().integer().empty(["", "null"]).allow(null).optional().messages({
    "number.base": "Targeted Company ID phải là số nguyên",
    "number.integer": "Targeted Company ID phải là số nguyên"
  }),
  reference: Joi.number().integer().empty(["", "null"]).allow(null).optional().messages({
    "number.base": "Reference ID phải là số nguyên",
    "number.integer": "Reference ID phải là số nguyên"
  }),
  candidate_levels: numberArray().optional()
});

updateCandidateController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  upload.single("file"),
  joiValidate(updateBodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);
    const body = req.body || {};

    const updateData: any = {};
    const hasProp = (o: any, p: string) => Object.prototype.hasOwnProperty.call(o, p);

    if (hasProp(body, "candidate_code")) updateData.candidate_code = body.candidate_code;
    if (hasProp(body, "candidate_name")) updateData.candidate_name = body.candidate_name.trim();
    if (hasProp(body, "candidate_email")) updateData.candidate_email = body.candidate_email;
    if (hasProp(body, "candidate_phone")) updateData.candidate_phone = body.candidate_phone;
    if (hasProp(body, "agency")) updateData.agency = body.agency;
    if (hasProp(body, "offer_date")) updateData.offer_date = body.offer_date;
    if (hasProp(body, "onboard_date")) updateData.onboard_date = body.onboard_date;
    if (hasProp(body, "expected_onboard_date")) updateData.expected_onboard_date = body.expected_onboard_date;
    if (hasProp(body, "feedback_date")) updateData.feedback_date = body.feedback_date;
    if (hasProp(body, "current_salary")) updateData.current_salary = body.current_salary;
    if (hasProp(body, "expected_salary")) updateData.expected_salary = body.expected_salary;
    if (hasProp(body, "status")) updateData.status = body.status.trim();
    if (hasProp(body, "note")) updateData.note = body.note;
    if (hasProp(body, "platform_id")) updateData.platform_id = body.platform_id;
    if (hasProp(body, "recruiter")) updateData.recruiter = body.recruiter;
    if (hasProp(body, "job_id")) updateData.job_id = body.job_id;
    if (hasProp(body, "targeted_company")) updateData.targeted_company = body.targeted_company;
    if (hasProp(body, "reference")) updateData.reference = body.reference;
    if (hasProp(body, "candidate_levels")) updateData.candidate_levels = body.candidate_levels;

    if (req.file) {
      updateData.file = {
        originalname: req.file.originalname,
        buffer: req.file.buffer
      };
    }

    const result = await withTransaction(async (pool) => {
      return await Candidate.update(id, updateData, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin ứng viên thành công",
      data: result
    });
  }
);

export default updateCandidateController;
