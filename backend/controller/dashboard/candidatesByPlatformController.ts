import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import passport from "@middlewares/passport";
import Dashboard from "@services/dashboard/_Dashboard";
import { withTransaction } from "@middlewares/withTransaction";

const candidatesByPlatformController = express.Router();

const joiQuery = Joi.object({
  job_id: Joi.number().integer().optional(),
  department_id: Joi.number().integer().optional(),
  status: Joi.string().optional(),
});

/**
 * GET /dashboard/candidates-by-platform
 * Query params:
 *   - job_id: number (optional)
 *   - department_id: number (optional)
 *   - status: string (optional)
 * Output: ChartDataPoint[] — [{ label: platform_name, value: count }]
 */
candidatesByPlatformController.get(
  "",
  passport.authenticate("jwt", { session: false }),
  joiValidate(joiQuery, "query"),
  async (req, res) => {
    const job_id = req.query.job_id ? Number(req.query.job_id) : undefined;
    const department_id = req.query.department_id ? Number(req.query.department_id) : undefined;
    const status = req.query.status as string | undefined;

    const data = await withTransaction((pool) =>
      Dashboard.candidatesByPlatform({ job_id, department_id, status }, pool)
    );

    res.status(200).json({
      result: true,
      message: "Lấy dữ liệu ứng viên theo nền tảng thành công",
      data,
    });
  }
);

export default candidatesByPlatformController;
