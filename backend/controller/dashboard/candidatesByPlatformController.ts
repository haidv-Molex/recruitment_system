import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import Dashboard from "@services/dashboard/_Dashboard";
import { withTransaction } from "@middlewares/withTransaction";

const candidatesByPlatformController = express.Router();

const joiQuery = Joi.object({
  status: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  department_id: Joi.alternatives().try(
    Joi.array().items(Joi.number().integer()),
    Joi.string(),
    Joi.number().integer()
  ).optional(),
  job_id: Joi.alternatives().try(
    Joi.array().items(Joi.number().integer()),
    Joi.string(),
    Joi.number().integer()
  ).optional(),
});

/**
 * GET /dashboard/candidates-by-platform
 * Query params:
 *   - status: string or array of strings (optional)
 *   - department_id: number or array of numbers or comma-separated string (optional)
 *   - job_id: number or array of numbers or comma-separated string (optional)
 * Output: ChartDataPoint[] — [{ label: platform_name, value: count }]
 */
candidatesByPlatformController.get(
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

    const statusVal = req.query.status;
    let status: string | string[] | undefined;
    if (statusVal !== undefined && statusVal !== null && statusVal !== '') {
      if (Array.isArray(statusVal)) {
        const filtered = statusVal.map((s) => String(s).trim()).filter((s) => s !== '');
        if (filtered.length > 0) {
          status = filtered;
        }
      } else {
        const strVal = String(statusVal).trim();
        if (strVal !== '') {
          if (strVal.includes(',')) {
            const parsed = strVal.split(',').map((s) => s.trim()).filter((s) => s !== '');
            if (parsed.length > 0) {
              status = parsed;
            }
          } else {
            status = strVal;
          }
        }
      }
    }

    const department_ids = parseIds(req.query.department_id);
    const job_ids = parseIds(req.query.job_id);

    const data = await withTransaction((pool) =>
      Dashboard.candidatesByPlatform({ status, department_ids, job_ids }, pool)
    , req.user);

    res.status(200).json({
      result: true,
      message: "Lấy dữ liệu ứng viên theo nền tảng thành công",
      data,
    });
  }
);

export default candidatesByPlatformController;
