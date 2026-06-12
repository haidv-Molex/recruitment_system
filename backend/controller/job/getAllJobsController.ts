import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getAllJobsController = express.Router();

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).optional().default(10),
  unlimited: Joi.boolean().optional().default(false),
  // Global full-text search
  search: Joi.string().optional().allow("").max(255),
  // Per-field filters
  job_code: Joi.string().optional().allow("").max(255),
  project: Joi.string().optional().allow("").max(255),
  department: Joi.string().optional().allow("").max(255),
  segment: Joi.string().optional().allow("").max(255),
  site: Joi.string().optional().allow("").max(255),
  job_title: Joi.string().optional().allow("").max(255),
  ee_level: Joi.string().optional().allow("").max(255),
  manager: Joi.string().optional().allow("").max(255),
  partner: Joi.string().optional().allow("").max(255),
  note: Joi.string().optional().allow("").max(500),
  request_date_from: Joi.string().optional().allow("").isoDate(),
  request_date_to: Joi.string().optional().allow("").isoDate(),
});

getAllJobsController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  async (req, res) => {
    const query = req.query as any;
    const page = Number(query.page);
    const limit = Number(query.limit);
    const unlimited = query.unlimited === true;

    const result = await withTransaction(async (pool) => {
      return await Job.getAll({
        page,
        limit,
        unlimited,
        search: query.search,
        job_code: query.job_code,
        project: query.project,
        department: query.department,
        segment: query.segment,
        site: query.site,
        job_title: query.job_title,
        ee_level: query.ee_level,
        manager: query.manager,
        partner: query.partner,
        note: query.note,
        request_date_from: query.request_date_from,
        request_date_to: query.request_date_to,
      }, pool);
    });

    const totalPages = unlimited ? 1 : Math.ceil(result.total / limit);

    res.status(200).json({
      result: true,
      message: "Lấy danh sách công việc thành công",
      data: result.items,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: result.total,
        limit,
      }
    });
  }
);

export default getAllJobsController;
