import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Candidate from "@services/candidate/_Candidate";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getAllCandidatesController = express.Router({ mergeParams: true });

const querySchema = Joi.object({
  page: Joi.number().integer().positive().optional().default(1).messages({
    "number.base": "Trang phải là số",
    "number.integer": "Trang phải là số nguyên",
    "number.positive": "Trang phải là số dương"
  }),
  limit: Joi.number().integer().positive().optional().default(10).messages({
    "number.base": "Giới hạn phải là số",
    "number.integer": "Giới hạn phải là số nguyên",
    "number.positive": "Giới hạn phải là số dương"
  }),
  search: Joi.string().optional().allow("").messages({
    "string.base": "Từ khóa tìm kiếm phải là chuỗi"
  }),
  status: Joi.string().optional().allow("").messages({
    "string.base": "Trạng thái phải là chuỗi"
  }),
  search_at: Joi.alternatives().try(
    Joi.array().items(
      Joi.string().valid(
        "name", "code", "email", "phone", "agency", "note", "current_salary", "expected_salary",
        "job_name", "job_code", "platform", "platform_code", "reference", "company"
      )
    ),
    Joi.string().valid(
      "name", "code", "email", "phone", "agency", "note", "current_salary", "expected_salary",
      "job_name", "job_code", "platform", "platform_code", "reference", "company"
    )
  ).optional().messages({
    "any.only": "Trường tìm kiếm không hợp lệ"
  }),
  offer_date_from: Joi.date().iso().optional().messages({ "date.format": "offer_date_from phải đúng định dạng ngày (YYYY-MM-DD hoặc ISO)" }),
  offer_date_to: Joi.date().iso().optional().messages({ "date.format": "offer_date_to phải đúng định dạng ngày (YYYY-MM-DD hoặc ISO)" }),
  onboard_date_from: Joi.date().iso().optional().messages({ "date.format": "onboard_date_from phải đúng định dạng ngày (YYYY-MM-DD hoặc ISO)" }),
  onboard_date_to: Joi.date().iso().optional().messages({ "date.format": "onboard_date_to phải đúng định dạng ngày (YYYY-MM-DD hoặc ISO)" }),
  expected_onboard_date_from: Joi.date().iso().optional().messages({ "date.format": "expected_onboard_date_from phải đúng định dạng ngày (YYYY-MM-DD hoặc ISO)" }),
  expected_onboard_date_to: Joi.date().iso().optional().messages({ "date.format": "expected_onboard_date_to phải đúng định dạng ngày (YYYY-MM-DD hoặc ISO)" }),
  feedback_date_from: Joi.date().iso().optional().messages({ "date.format": "feedback_date_from phải đúng định dạng ngày (YYYY-MM-DD hoặc ISO)" }),
  feedback_date_to: Joi.date().iso().optional().messages({ "date.format": "feedback_date_to phải đúng định dạng ngày (YYYY-MM-DD hoặc ISO)" }),
  
  // Specific candidate filters
  candidate_code: Joi.string().optional().allow(""),
  candidate_name: Joi.string().optional().allow(""),
  candidate_email: Joi.string().optional().allow(""),
  candidate_phone: Joi.string().optional().allow(""),
  agency: Joi.string().optional().allow(""),
  note: Joi.string().optional().allow(""),
  job_code: Joi.string().optional().allow(""),
  project: Joi.string().optional().allow(""),
  platform: Joi.string().optional().allow(""),
  reference: Joi.string().optional().allow(""),
  company: Joi.string().optional().allow("")
});

getAllCandidatesController.get("/",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  async (req, res) => {
    const page = parseInt(req.query.page as string || "1", 10);
    const limit = parseInt(req.query.limit as string || "10", 10);
    const search = req.query.search as string || "";
    const status = req.query.status as string || "";

    const rawSearchAt = req.query.search_at;
    const search_at = Array.isArray(rawSearchAt)
      ? rawSearchAt as string[]
      : (rawSearchAt ? [rawSearchAt as string] : undefined);

    const parseDateParam = (val: any) => val ? new Date(val) : undefined;
    const offer_date_from = parseDateParam(req.query.offer_date_from);
    const offer_date_to = parseDateParam(req.query.offer_date_to);
    const onboard_date_from = parseDateParam(req.query.onboard_date_from);
    const onboard_date_to = parseDateParam(req.query.onboard_date_to);
    const expected_onboard_date_from = parseDateParam(req.query.expected_onboard_date_from);
    const expected_onboard_date_to = parseDateParam(req.query.expected_onboard_date_to);
    const feedback_date_from = parseDateParam(req.query.feedback_date_from);
    const feedback_date_to = parseDateParam(req.query.feedback_date_to);

    const candidate_code = req.query.candidate_code as string || "";
    const candidate_name = req.query.candidate_name as string || "";
    const candidate_email = req.query.candidate_email as string || "";
    const candidate_phone = req.query.candidate_phone as string || "";
    const agency = req.query.agency as string || "";
    const note = req.query.note as string || "";
    const job_code = req.query.job_code as string || "";
    const project = req.query.project as string || "";
    const platform = req.query.platform as string || "";
    const reference = req.query.reference as string || "";
    const company = req.query.company as string || "";

    const { items, total } = await withTransaction(async (pool) => {
      return await Candidate.getAll({
        page, limit, search, status, search_at,
        offer_date_from, offer_date_to,
        onboard_date_from, onboard_date_to,
        expected_onboard_date_from, expected_onboard_date_to,
        feedback_date_from, feedback_date_to,
        candidate_code, candidate_name, candidate_email, candidate_phone,
        agency, note, job_code, project, platform, reference, company
      }, pool);
    });

    res.status(200).json({
      result: true,
      message: "Lấy danh sách ứng viên thành công",
      data: items,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit) || 1,
        total_items: total
      }
    });
  }
);

export default getAllCandidatesController;
