import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import { numberArray, stringArray } from "@utilities/joiTypes";
import Candidate from "@services/candidate/_Candidate";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const batchImportCandidatesController = express.Router();

const candidateItemSchema = Joi.object({
  candidate_name: Joi.string().min(1).max(255).required().messages({
    "any.required": "Tên ứng viên là bắt buộc",
    "string.empty": "Tên ứng viên không được để trống",
  }),
  status: Joi.string().min(1).max(100).required().messages({
    "any.required": "Trạng thái ứng viên là bắt buộc",
    "string.empty": "Trạng thái ứng viên không được để trống",
  }),
  candidate_code: Joi.string().max(255).allow("", null).optional(),
  candidate_email: Joi.string().email().max(255).allow("", null).optional(),
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
  recruiter: Joi.number().integer().allow(null).optional(),
  platform_id: Joi.number().integer().allow(null).optional(),
  targeted_company: Joi.number().integer().allow(null).optional(),
  reference: Joi.number().integer().allow(null).optional(),
  candidate_levels: numberArray().optional(),

  // _name tự động tạo mới
  recruiter_name: Joi.string().max(255).allow("", null).optional(),
  reference_name: Joi.string().max(255).allow("", null).optional(),
  platform_name: Joi.string().max(255).allow("", null).optional(),
  targeted_company_name: Joi.string().max(255).allow("", null).optional(),
  candidate_levels_name: stringArray().optional(),
  job_code: Joi.string().max(255).allow("", null).optional(),
});

const bodySchema = Joi.object({
  candidates: Joi.array().items(candidateItemSchema).required().messages({
    "any.required": "Danh sách ứng viên là bắt buộc",
    "array.base": "Danh sách ứng viên phải là mảng",
  }),
});

batchImportCandidatesController.post(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const { candidates } = req.body;

    const result = await withTransaction(async (pool) => {
      return await Candidate.batchImport(candidates, pool);
    });

    res.status(200).json({
      result: true,
      message: "Thực hiện import loạt ứng viên thành công",
      data: result,
    });
  }
);

export default batchImportCandidatesController;
