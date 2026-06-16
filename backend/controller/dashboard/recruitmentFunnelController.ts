import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import Dashboard from "@services/dashboard/_Dashboard";
import { withTransaction } from "@middlewares/withTransaction";
import type { userModel } from "@model/user/userModel";

const recruitmentFunnelController = express.Router();

const joiQuery = Joi.object({
  site_id: Joi.alternatives().try(
    Joi.array().items(Joi.number().integer()),
    Joi.string(),
    Joi.number().integer()
  ).optional(),
  job_id: Joi.alternatives().try(
    Joi.array().items(Joi.number().integer()),
    Joi.string(),
    Joi.number().integer()
  ).optional(),
  department_id: Joi.alternatives().try(
    Joi.array().items(Joi.number().integer()),
    Joi.string(),
    Joi.number().integer()
  ).optional(),
  recruiter_id: Joi.number().integer().optional(),
});

/**
 * GET /dashboard/funnel
 * Query params:
 *   - site_id: number or array of numbers or comma-separated string (optional)
 *   - job_id: number or array of numbers or comma-separated string (optional)
 *   - department_id: number or array of numbers or comma-separated string (optional)
 *   - recruiter_id: number (optional, defaults to logged-in user's user_id)
 * Output: ChartDataPoint[] — [{ label, value }]
 */
recruitmentFunnelController.get(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(joiQuery, "query"),
  async (req, res) => {
    const parseIds = (val: any): number[] | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      if (Array.isArray(val)) {
        return val.map((v) => Number(v)).filter((v) => !isNaN(v));
      }
      return String(val)
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => !isNaN(v));
    };

    const site_ids = parseIds(req.query.site_id);
    const job_ids = parseIds(req.query.job_id);
    const department_ids = parseIds(req.query.department_id);

    // Fallback to logged-in user's user_id
    const user = req.user as any;
    const recruiter_id = req.query.recruiter_id
      ? Number(req.query.recruiter_id)
      : user?.user_id;

    const data = await withTransaction((pool) =>
      Dashboard.recruitmentFunnel({ site_ids, job_ids, department_ids, recruiter_id }, pool)
    );

    res.status(200).json({
      result: true,
      message: "Lấy dữ liệu phễu tuyển dụng thành công",
      data,
    });
  }
);

export default recruitmentFunnelController;
