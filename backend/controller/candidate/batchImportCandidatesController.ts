import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import { numberArray, stringArray } from "@utilities/joiTypes";
import Candidate from "@services/candidate/_Candidate";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const batchImportCandidatesController = express.Router();

const candidateItemSchema = Joi.object({
  candidate_name: Joi.string().max(255).allow("", null).optional(),
  status: Joi.string().min(1).max(100).required().messages({
    "any.required": "Trạng thái ứng viên là bắt buộc",
    "string.empty": "Trạng thái ứng viên không được để trống",
  }),
  candidate_code: Joi.string().max(255).allow("", null).optional(),
  candidate_email: Joi.string().email().max(255).required().messages({
    "any.required": "Email ứng viên là bắt buộc",
    "string.empty": "Email ứng viên không được để trống",
    "string.email": "Email ứng viên không đúng định dạng chuẩn name@example.com",
    "string.max": "Email không được vượt quá 255 ký tự",
  }),
  candidate_phone: Joi.string().max(50).allow("", null).optional(),
  agency: Joi.string().max(255).allow("", null).optional(),
  offer_date: Joi.date().iso().empty(["", "null"]).allow(null).optional(),
  onboard_date: Joi.date().iso().empty(["", "null"]).allow(null).optional(),
  expected_onboard_date: Joi.date().iso().empty(["", "null"]).allow(null).optional(),
  feedback_date: Joi.date().iso().empty(["", "null"]).allow(null).optional(),
  current_salary: Joi.string().max(255).allow("", null).optional(),
  expected_salary: Joi.string().max(255).allow("", null).optional(),
  note: Joi.string().max(5000).allow("", null).optional(),

  // ID gốc
  job_id: Joi.number().integer().allow(null).optional(),
  platform_id: Joi.number().integer().allow(null).optional(),
  targeted_company: Joi.number().integer().allow(null).optional(),
  reference: Joi.number().integer().allow(null).optional(),
  candidate_levels: numberArray().optional(),

  // _name tự động tạo mới
  reference_name: Joi.string().max(255).allow("", null).optional(),
  platform_name: Joi.string().max(255).allow("", null).optional(),
  targeted_company_name: Joi.string().max(255).allow("", null).optional(),
  candidate_levels_name: stringArray().optional(),
  job_code: Joi.string().max(255).allow("", null).optional(),
  project: Joi.string().max(255).allow("", null).optional(),
});

const bodySchema = Joi.object({
  candidates: Joi.array().required().messages({
    "any.required": "Danh sách ứng viên là bắt buộc",
    "array.base": "Danh sách ứng viên phải là mảng",
  }),
});

batchImportCandidatesController.post(
  "",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Validate request body structure first
    const { error: bodyError, value: bodyValue } = bodySchema.validate(req.body, { abortEarly: false });
    if (bodyError) {
      return res.status(400).json({
        result: false,
        message: "Cấu trúc danh sách không hợp lệ",
        details: bodyError.details.map((d) => d.message),
      });
    }

    const { candidates } = bodyValue;

    const validCandidates: any[] = [];
    const errors: any[] = [];

    candidates.forEach((c: any, index: number) => {
      const { error, value } = candidateItemSchema.validate(c, {
        abortEarly: false,
        convert: true,
        errors: {
          label: "key",
          wrap: { label: false },
        },
      });

      if (error) {
        errors.push({
          candidate_name: c.candidate_name || `Dòng ${index + 1}`,
          message: error.details.map((d) => d.message).join(", "),
        });
      } else {
        validCandidates.push(value);
      }
    });

    let result = {
      success: true,
      importedCount: 0,
      errors: [] as any[],
    };

    if (validCandidates.length > 0) {
      const importRes = await withTransaction(async (pool) => {
         return await Candidate.batchImport(validCandidates, pool);
      }, req.user);
      result = {
        success: importRes.success,
        importedCount: importRes.importedCount,
        errors: importRes.errors,
      };
    }

    res.status(200).json({
      result: true,
      message: "Thực hiện import loạt ứng viên thành công",
      data: {
        success: result.success && errors.length === 0,
        importedCount: result.importedCount,
        errors: [...errors, ...result.errors],
      },
    });
  }
);

export default batchImportCandidatesController;
